import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFormulaToolReply, GROQ_MODELS, type FormulaLanguage, type FormulaToolMode } from "@/lib/groq";
import { consumeDailyQuota, getDailyQuotaStatus } from "@/lib/quota";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { AUTH_DISABLED, MOCK_USER_ID } from "@/lib/dev-auth";
import { findSimilarCachedAnswer, markCacheHit, saveAnswerToCache } from "@/lib/answerCache";
import { isAiRefusal } from "@/lib/aiRefusals";

export const runtime = "nodejs";

interface GenerateFormulaRequestBody {
  mode: FormulaToolMode;
  input: string;
  language: FormulaLanguage;
  turnstileToken: string;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Guests (no session) are allowed through with a small daily allowance
  // enforced client-side only (see src/lib/useDailyQuota.ts) — `hasSession`
  // gates every Supabase read/write below, same as /api/chat.
  let userId = MOCK_USER_ID;
  if (!AUTH_DISABLED) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? "";
  }
  const hasSession = !AUTH_DISABLED && userId !== "";

  let body: GenerateFormulaRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (body.mode !== "create" && body.mode !== "explain") {
    return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
  }
  if (body.language !== "fr" && body.language !== "en") {
    return NextResponse.json({ error: "Langue invalide." }, { status: 400 });
  }

  const input = body.input?.trim();
  if (!input) {
    return NextResponse.json({ error: "Le texte ne peut pas être vide." }, { status: 400 });
  }
  if (input.length > 2000) {
    return NextResponse.json({ error: "Le texte est trop long (2000 caractères max)." }, { status: 400 });
  }

  if (!AUTH_DISABLED) {
    const verification = await verifyTurnstileToken(
      body.turnstileToken,
      request.headers.get("x-forwarded-for") ?? undefined
    );
    if (!verification.success) {
      return NextResponse.json(
        { error: "Vérification anti-abus échouée. Rechargez la page et réessayez." },
        { status: 403 }
      );
    }
  }

  // Explanations don't depend on the FR/EN selector (always explained in
  // French), so they share one namespace; "create" caches per output
  // language since the same description yields a different formula in FR
  // vs EN. This also keeps the two modes from ever matching each other.
  const namespace = body.mode === "explain" ? "formula:explain" : `formula:create:${body.language}`;

  if (hasSession) {
    const cached = await findSimilarCachedAnswer(supabase, input, namespace);
    if (cached) {
      await markCacheHit(supabase, cached.id);
      // Cache hits never touch the daily quota — no Groq call was made.
      return NextResponse.json({ result: cached.answer, quotaRemaining: null, cached: true, quotaConsumed: false });
    }
  }

  // Read-only pre-check: fail fast (no Groq call, no tokens spent) if the
  // user is already at their limit.
  let quotaRemaining: number | null = null;
  if (hasSession) {
    let status;
    try {
      status = await getDailyQuotaStatus(supabase, userId);
    } catch (error) {
      console.error("Quota check failed:", error);
      return NextResponse.json({ error: "Impossible de vérifier votre quota." }, { status: 500 });
    }
    if (!status.unlimited && status.remaining <= 0) {
      return NextResponse.json(
        { error: `Crédits IA épuisés (${status.limit}/jour). Revenez demain.` },
        { status: 429 }
      );
    }
    quotaRemaining = status.unlimited ? null : status.remaining;
  }

  let result: string;
  try {
    result = await generateFormulaToolReply(body.mode, input, body.language);
  } catch (error) {
    console.error("Formula tool generation failed:", error);
    return NextResponse.json({ error: "Échec de la génération. Réessayez." }, { status: 502 });
  }

  if (result.trim()) {
    if (hasSession) {
      await saveAnswerToCache(supabase, input, result, GROQ_MODELS.primary, namespace);
    }
  }

  // Bill the quota credit only once we know this was a real, complete
  // answer: the Groq call didn't throw and it isn't the AI's built-in
  // refusal for an out-of-scope/invalid request. Rejected requests are free.
  let quotaConsumed = false;
  const isRealAnswer = result.trim() && !isAiRefusal(result);
  if (hasSession && isRealAnswer) {
    try {
      const quota = await consumeDailyQuota(supabase, userId);
      quotaRemaining = quota.unlimited ? null : quota.remaining;
      quotaConsumed = true;
    } catch (error) {
      console.error("Failed to record quota usage:", error);
    }
  }

  return NextResponse.json({ result, quotaRemaining, cached: false, quotaConsumed });
}
