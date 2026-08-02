import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamExcelAssistantReply, GROQ_MODELS } from "@/lib/groq";
import { consumeDailyQuota, getDailyQuotaStatus } from "@/lib/quota";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { AUTH_DISABLED, MOCK_USER_ID } from "@/lib/dev-auth";
import { findSimilarCachedAnswer, markCacheHit, saveAnswerToCache } from "@/lib/answerCache";
import { isAiRefusal } from "@/lib/aiRefusals";

export const runtime = "nodejs";

const HISTORY_LIMIT = 20;

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  conversationId?: string;
  message: string;
  turnstileToken: string;
  /** Prior turns from client state — only used when AUTH_DISABLED (no DB to reconstruct history from). */
  history?: ChatMessageInput[];
  /** Client-extracted spreadsheet structure summary (see src/lib/fileAnalysis.ts) — never the raw file. */
  fileContext?: string;
}

const MAX_FILE_CONTEXT_CHARS = 6000;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(text: string, headers: Record<string, string>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, { headers });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Guests (no session) are allowed through: they get a small daily
  // allowance enforced client-side only (see src/lib/useDailyQuota.ts),
  // trading airtight abuse prevention for not gatekeeping the AI tools
  // behind a mandatory account. `hasSession` gates every Supabase read/write
  // below — a guest request behaves exactly like AUTH_DISABLED (ephemeral,
  // client-held history, no cache, no server-side quota).
  let userId = MOCK_USER_ID;
  if (!AUTH_DISABLED) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? "";
  }
  const hasSession = !AUTH_DISABLED && userId !== "";

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonError("Corps de requête invalide.", 400);
  }

  const message = body.message?.trim();
  if (!message) {
    return jsonError("Le message ne peut pas être vide.", 400);
  }
  if (message.length > 4000) {
    return jsonError("Le message est trop long (4000 caractères max).", 400);
  }

  const fileContext = body.fileContext?.trim().slice(0, MAX_FILE_CONTEXT_CHARS) || undefined;

  if (!AUTH_DISABLED) {
    const verification = await verifyTurnstileToken(
      body.turnstileToken,
      request.headers.get("x-forwarded-for") ?? undefined
    );
    if (!verification.success) {
      return jsonError("Vérification anti-abus échouée. Rechargez la page et réessayez.", 403);
    }
  }

  // The answer cache only applies to conversation-starting questions with no
  // attached file: a follow-up's correct answer depends on prior context,
  // and a file-analysis answer is specific to that one file's content — in
  // both cases reusing another user's cached answer would very likely be
  // wrong.
  const isFreshConversation = !body.conversationId;
  const isCacheable = isFreshConversation && !fileContext;
  let conversationId = body.conversationId;

  if (hasSession && isCacheable) {
    const cached = await findSimilarCachedAnswer(supabase, message);
    if (cached) {
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: message.slice(0, 60) })
        .select("id")
        .single();

      if (convError || !conversation) {
        console.error("Failed to create conversation for cache hit:", convError);
        return jsonError("Impossible de créer la conversation.", 500);
      }
      conversationId = conversation.id;

      await supabase.from("messages").insert([
        { conversation_id: conversationId, user_id: userId, role: "user", content: message },
        { conversation_id: conversationId, user_id: userId, role: "assistant", content: cached.answer },
      ]);

      await markCacheHit(supabase, cached.id);

      // Cache hits never touch the daily quota — no Groq call was made.
      return textResponse(cached.answer, {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": conversationId,
        "X-Cache": "HIT",
        "Cache-Control": "no-cache",
      });
    }
  }

  // Read-only pre-check: fail fast (no Groq call, no tokens spent) if the
  // user is already at their limit. The actual credit is only spent below,
  // after we know the generation genuinely succeeded.
  if (hasSession) {
    let status;
    try {
      status = await getDailyQuotaStatus(supabase, userId);
    } catch (error) {
      console.error("Quota check failed:", error);
      return jsonError("Impossible de vérifier votre quota.", 500);
    }
    if (!status.unlimited && status.remaining <= 0) {
      return jsonError(`Crédits IA épuisés (${status.limit}/jour). Revenez demain.`, 429);
    }
  }

  let orderedHistory: ChatMessageInput[];

  if (!hasSession) {
    // Dev bypass or anonymous guest: no Supabase involved at all,
    // conversation memory lives only in the client's React state for the
    // duration of the page session.
    conversationId = conversationId ?? crypto.randomUUID();
    orderedHistory = [...(body.history ?? []), { role: "user", content: message }];
  } else {
    // Get or create the conversation this message belongs to.
    if (!conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: message.slice(0, 60) })
        .select("id")
        .single();

      if (convError || !conversation) {
        console.error("Failed to create conversation:", convError);
        return jsonError("Impossible de créer la conversation.", 500);
      }
      conversationId = conversation.id;
    }

    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: message,
    });
    if (userMsgError) {
      console.error("Failed to persist user message:", userMsgError);
      return jsonError("Impossible d'enregistrer votre message.", 500);
    }

    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    orderedHistory = (history ?? []).reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  // The attached file's structure summary rides along with this turn only
  // (it's already the latest entry in orderedHistory) — merged in just for
  // the Groq call, never persisted as-is, so the stored/displayed chat
  // bubble stays the user's actual typed question.
  const groqInput = fileContext
    ? orderedHistory.map((entry, i) =>
        i === orderedHistory.length - 1 && entry.role === "user"
          ? { ...entry, content: `${fileContext}\n\nQuestion de l'utilisateur : ${entry.content}` }
          : entry
      )
    : orderedHistory;

  const groqStream = await streamExcelAssistantReply(groqInput);

  const encoder = new TextEncoder();
  let fullReply = "";
  let streamFailed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullReply += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (error) {
        console.error("Groq streaming error:", error);
        streamFailed = true;
        controller.enqueue(
          encoder.encode("\n\n[Une erreur est survenue pendant la génération de la réponse.]")
        );
      } finally {
        controller.close();

        // Bill the quota credit only once we know this was a real, complete
        // answer: no mid-stream failure and not the AI's built-in refusal
        // for an out-of-scope question. Rejected/failed requests are free.
        const isRealAnswer = !streamFailed && fullReply.trim() && !isAiRefusal(fullReply);

        if (hasSession && isRealAnswer) {
          try {
            await consumeDailyQuota(supabase, userId);
          } catch (error) {
            console.error("Failed to record quota usage:", error);
          }
        }

        if (hasSession && fullReply.trim()) {
          const { error: assistantMsgError } = await supabase.from("messages").insert({
            conversation_id: conversationId!,
            user_id: userId,
            role: "assistant",
            content: fullReply,
          });
          if (assistantMsgError) {
            console.error("Failed to persist assistant message:", assistantMsgError);
          }

          if (isCacheable) {
            await saveAnswerToCache(supabase, message, fullReply, GROQ_MODELS.primary);
          }
        }
      }
    },
  });

  // Whether this response will end up billing a credit isn't known until
  // the stream finishes, so it can't be reported via a response header (headers
  // are sent before the body). The client re-checks quota (GET /api/quota,
  // or the AUTH_DISABLED localStorage counter) once the stream completes.
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": conversationId!,
      "X-Cache": "MISS",
      "Cache-Control": "no-cache",
    },
  });
}
