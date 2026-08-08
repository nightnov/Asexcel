"use client";

import { useMemo, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import TurnstileWidget from "./TurnstileWidget";
import QuotaCounter from "./QuotaCounter";
import QuotaModal from "./QuotaModal";
import AuthModal from "./AuthModal";
import AdBanner from "./AdBanner";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { detectLanguage } from "@/lib/excelFormulaTranslator";
import { useDailyQuota, GUEST_DAILY_LIMIT } from "@/lib/useDailyQuota";
import { MEMBER_DAILY_LIMIT } from "@/lib/quotaConfig";
import { isAiRefusal } from "@/lib/aiRefusals";
import { useLocale } from "@/components/LocaleProvider";

// Loaded on demand: react-markdown + remark pull in a non-trivial amount of
// code, no reason to ship it in the initial bundle for a page that starts
// with an empty result box.
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => null,
});

type Mode = "create" | "explain";
type Language = "fr" | "en";

/**
 * Cheap client-side pre-check so obviously-not-a-formula input never
 * triggers a Groq call at all (0 token) — reuses the same function-name
 * dictionary as the formula translator rather than a hand-rolled regex.
 */
function looksLikeExcelFormula(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("=")) return true;
  return detectLanguage(trimmed) !== null;
}

/**
 * "Create" replies are "formula\n\nexplanation". Splits them so the formula
 * can be shown in its own code box and copied on its own — defensively
 * strips stray wrapping backticks/quotes in case the model didn't fully
 * follow the "raw formula, no backticks" instruction.
 */
function splitCreateResult(result: string): { formula: string; explanation: string } {
  const [firstLine, ...rest] = result.split("\n\n");
  const formula = (firstLine ?? "").trim().replace(/^`+|`+$/g, "");
  return { formula, explanation: rest.join("\n\n").trim() };
}

const markdownComponents = {
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="leading-relaxed [&:not(:last-child)]:mb-2" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal space-y-2 pl-5" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc space-y-2 pl-5" {...props} />
  ),
  // Remark renders "tight" list items (the common case here — single-line
  // steps) as bare text inside <li>, NOT wrapped in <p>, so the `p` override
  // above never applies to them. Without its own leading-relaxed, wrapped
  // lines within one step render with the browser's tight default
  // line-height and visually overlap the line above/below. The gap between
  // items comes from the parent <ol>/<ul>'s space-y-2, not a margin here —
  // Tailwind's space-y utility forces margin-bottom:0 on every item but the
  // last, so an mb-* on <li> itself would just be silently overridden.
  li: (props: React.ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
};

export default function FormulaGenerator() {
  const { t } = useLocale();
  const tt = t.tools.generateur;
  const router = useRouter();

  const MODE_TABS: { value: Mode; label: string }[] = [
    { value: "create", label: tt.tabCreate },
    { value: "explain", label: tt.tabExplain },
  ];

  const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
    { value: "fr", label: tt.langFr },
    { value: "en", label: tt.langEn },
  ];

  const PLACEHOLDERS: Record<Mode, string> = {
    create: tt.placeholderCreate,
    explain: tt.placeholderExplain,
  };

  const [mode, setMode] = useState<Mode>("create");
  const [language, setLanguage] = useState<Language>("fr");
  // Separate state per tab so typing in one never leaks into the other.
  const [inputCreate, setInputCreate] = useState("");
  const [inputExplain, setInputExplain] = useState("");
  const input = mode === "create" ? inputCreate : inputExplain;
  const setInput = mode === "create" ? setInputCreate : setInputExplain;
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cached, setCached] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const quota = useDailyQuota();

  const { formula: resultFormula, explanation: resultExplanation } = useMemo(
    () => splitCreateResult(result),
    [result]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (quota.exhausted) {
      setShowQuotaModal(true);
      return;
    }

    if (mode === "explain" && !looksLikeExcelFormula(trimmed)) {
      setError(`⚠️ ${tt.invalidFormula}`);
      setResult("");
      setCached(false);
      return;
    }

    if (!AUTH_DISABLED && !turnstileToken) {
      setError(tt.antiAbuseChecking);
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult("");
    setCached(false);

    try {
      const res = await fetch("/api/generate-formula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input: trimmed, language, turnstileToken }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setShowQuotaModal(true);
        await quota.refresh();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? tt.genericError);
      }

      setResult(data.result ?? "");
      setCached(Boolean(data.cached));

      // A credit is only spent on a real, complete, non-refused answer —
      // never on a cache hit and never on the AI's own "out of scope"
      // rejection. In AUTH_DISABLED mode the server never touches quota at
      // all, so the client is the only enforcement point and has to apply
      // the exact same rule locally.
      if (quota.isLocal) {
        if (!data.cached && data.result && !isAiRefusal(data.result)) {
          quota.recordLocalUse();
        }
      } else {
        quota.setRemaining(data.quotaRemaining ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tt.genericError);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    // "Create" mode: copy the formula alone, never the explanation below it.
    const textToCopy = mode === "create" ? resultFormula : result;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError(tt.clipboardError);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{tt.title}</h1>
      <div className="mb-2 mt-2">
        <QuotaCounter
          remaining={quota.remaining}
          limit={quota.limit}
          unlimited={quota.unlimited}
          loading={quota.loading}
          labels={t.quota}
          onReset={AUTH_DISABLED ? quota.resetLocal : undefined}
        />
      </div>
      <p className="mb-6 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-sm">
            {MODE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setMode(tab.value);
                  setResult("");
                  setError(null);
                }}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  mode === tab.value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "create" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{tt.functionsIn}</span>
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-xs">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLanguage(opt.value)}
                    className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                      language === opt.value
                        ? "bg-brand-600 text-white"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {mode === "create" ? tt.describeNeedLabel : tt.formulaToExplainLabel}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              rows={4}
              spellCheck={false}
              disabled={quota.exhausted}
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim() || quota.exhausted}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {isLoading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isLoading
              ? tt.generating
              : quota.exhausted
                ? tt.quotaExhausted
                : mode === "create"
                  ? tt.generateCta
                  : tt.explainCta}
          </button>
          {quota.exhausted && !quota.loading && (
            <button
              type="button"
              onClick={() => setShowQuotaModal(true)}
              className="ml-2 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              {tt.unlockMore}
            </button>
          )}
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {(result || isLoading) && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-500">{tt.resultLabel}</label>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40"
              >
                {copied ? tt.copied : tt.copy}
              </button>
            </div>
            {isLoading && !result ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                {tt.generatingResult}
              </div>
            ) : mode === "create" ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                  {resultFormula}
                </div>
                {resultExplanation && (
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm leading-relaxed text-slate-600">
                    <ReactMarkdown components={markdownComponents}>{resultExplanation}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-800">
                <ReactMarkdown components={markdownComponents}>{result}</ReactMarkdown>
              </div>
            )}
            {cached && (
              <p className="mt-1 text-[11px] text-slate-400">⚡ {tt.cachedNote}</p>
            )}
            {result && !isLoading && <AdBanner slot="tool-result" className="mt-4" />}
          </div>
        )}
      </div>

      {!AUTH_DISABLED && <TurnstileWidget onVerify={setTurnstileToken} />}
      <QuotaModal
        open={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        plan={quota.plan}
        guestLimit={GUEST_DAILY_LIMIT}
        memberLimit={MEMBER_DAILY_LIMIT}
        labels={t.quota}
        onCreateAccount={() => setShowAuthModal(true)}
        onUpgrade={() => router.push("/checkout")}
      />
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
