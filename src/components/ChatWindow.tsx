"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import ChatMessage, { type ChatMessageData } from "./ChatMessage";
import FileUpload from "./FileUpload";
import TurnstileWidget from "./TurnstileWidget";
import LandingHeader from "./LandingHeader";
import QuotaCounter from "./QuotaCounter";
import QuotaModal from "./QuotaModal";
import AdBanner from "./AdBanner";
import { poppins, inter } from "@/lib/fonts";
import landingStyles from "@/app/landing.module.css";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { TURNSTILE_ENABLED } from "@/lib/turnstileConfig";
import { useDailyQuota, GUEST_DAILY_LIMIT } from "@/lib/useDailyQuota";
import { MEMBER_DAILY_LIMIT } from "@/lib/quotaConfig";
import { isAiRefusal } from "@/lib/aiRefusals";
import type { FileAnalysis } from "@/lib/fileAnalysis";
import { useLocale } from "@/components/LocaleProvider";

const DEFAULT_FILE_PROMPT =
  "Analyse ce fichier et fais-moi un résumé clair : ce qu'il contient, la qualité des données, et le nombre d'entrées.";

export default function ChatWindow() {
  const { t } = useLocale();
  const tc = t.chat;
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const quota = useDailyQuota();
  // Turnstile tokens are single-use server-side; the widget re-issues a new
  // one automatically after each verification, which is why this is state
  // (not a ref) — every fresh token must trigger a re-render so requests
  // pick it up.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const conversationIdRef = useRef<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // No question typed but a file is attached: default to asking for a
    // full summary, so "attach + send" alone satisfies the "generate a
    // clear summary" requirement without forcing the user to type anything.
    const trimmed = input.trim() || (fileAnalysis ? DEFAULT_FILE_PROMPT : "");
    if (!trimmed || isStreaming) return;

    if (quota.exhausted) {
      setShowQuotaModal(true);
      return;
    }

    // Only wait on a Turnstile token when Turnstile is actually configured —
    // otherwise the widget never renders, no token ever arrives, and this
    // guard would block every message permanently.
    if (!AUTH_DISABLED && TURNSTILE_ENABLED && !turnstileToken) {
      setError(tc.antiAbuseChecking);
      return;
    }

    const historySoFar = messages;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    let fullReply = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          message: trimmed,
          turnstileToken,
          history: historySoFar,
          fileContext: fileAnalysis?.contextText,
        }),
      });

      if (res.status === 429) {
        setMessages((prev) => prev.slice(0, -2)); // drop the optimistic user+assistant bubbles
        setShowQuotaModal(true);
        await quota.refresh();
        return;
      }
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? tc.genericError);
      }

      const nextConversationId = res.headers.get("X-Conversation-Id");
      if (nextConversationId) conversationIdRef.current = nextConversationId;

      const isCacheHit = res.headers.get("X-Cache") === "HIT";
      if (isCacheHit) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], cached: true };
          return next;
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;

        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }

      // A credit is only spent server-side on a real, complete, non-refused
      // answer — never on a cache hit. The response has no way to report
      // the updated count via headers (they're sent before the stream
      // finishes), so the client re-syncs afterwards: a fresh /api/quota
      // read when there's a real session, or the local demo counter when
      // AUTH_DISABLED (which mirrors the same "not cached, not a refusal"
      // rule the server applies).
      if (quota.isLocal) {
        if (!isCacheHit && fullReply.trim() && !isAiRefusal(fullReply)) {
          quota.recordLocalUse();
        }
      } else {
        await quota.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : tc.genericError;
      setError(message);
      setMessages((prev) => prev.slice(0, -1)); // drop the empty assistant bubble
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className={`${landingStyles.page} flex h-screen flex-col ${poppins.variable} ${inter.variable}`}>
      <LandingHeader />

      <div className="mx-auto flex w-full max-w-5xl flex-1 justify-center gap-6 overflow-hidden px-4 py-4">
        <div className="flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            {tc.backToHome}
          </Link>
          <QuotaCounter
            remaining={quota.remaining}
            limit={quota.limit}
            unlimited={quota.unlimited}
            loading={quota.loading}
            labels={t.quota}
            onReset={AUTH_DISABLED ? quota.resetLocal : undefined}
          />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              {tc.emptyState}
            </div>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} cached={m.cached} />
          ))}
        </div>

        {fileAnalysis && (
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">
              📎 {tc.fileLoadedPrefix} {fileAnalysis.fileName}
              <span className="text-brand-400">
                · {fileAnalysis.rowCount} {fileAnalysis.rowCount > 1 ? tc.linePlural : tc.lineSingular} ·{" "}
                {fileAnalysis.columnCount} {fileAnalysis.columnCount > 1 ? tc.columnPlural : tc.columnSingular}
              </span>
              <button
                type="button"
                onClick={() => setFileAnalysis(null)}
                title={tc.removeFileTitle}
                className="ml-1 rounded-full text-brand-500 hover:text-brand-800"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={quota.exhausted}
              placeholder={fileAnalysis ? tc.filePlaceholder : tc.textPlaceholder}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={isStreaming || (!input.trim() && !fileAnalysis) || quota.exhausted}
              className="h-fit rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {quota.exhausted ? tc.quotaExhausted : tc.sendCta}
            </button>
          </div>
          {quota.exhausted && !quota.loading && (
            <button
              type="button"
              onClick={() => setShowQuotaModal(true)}
              className="self-start text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              {tc.unlockMore}
            </button>
          )}
          <FileUpload onAnalyzed={setFileAnalysis} disabled={isStreaming} />
        </form>

        {!AUTH_DISABLED && TURNSTILE_ENABLED && <TurnstileWidget onVerify={setTurnstileToken} />}
      </div>

      <aside className="hidden w-[300px] shrink-0 pt-1 lg:block">
        <AdBanner slot="sidebar" />
      </aside>
      </div>

      <QuotaModal
        open={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        plan={quota.plan}
        guestLimit={GUEST_DAILY_LIMIT}
        memberLimit={MEMBER_DAILY_LIMIT}
        labels={t.quota}
        onCreateAccount={() => router.push("/inscription")}
        onUpgrade={() => router.push("/checkout")}
      />
    </div>
  );
}
