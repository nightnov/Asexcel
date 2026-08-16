"use client";

import { useMemo, useState } from "react";
import {
  translateFormula,
  swapSeparators,
  detectLanguage,
  LANGUAGES,
  type LangCode,
} from "@/lib/excelFormulaTranslator";
import { useLocale } from "@/components/LocaleProvider";
import { useAdInterstitial } from "@/lib/useAdInterstitial";
import AdInterstitialModal from "@/components/AdInterstitialModal";

type SourceSelection = "auto" | LangCode;

export default function FormulaTranslator() {
  const { t } = useLocale();
  const tt = t.tools.traducteur;

  const [input, setInput] = useState("");
  const [sourceSelection, setSourceSelection] = useState<SourceSelection>("auto");
  const [targetLang, setTargetLang] = useState<LangCode>("en");
  const [separatorsSwapped, setSeparatorsSwapped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const detectedLang = useMemo(() => detectLanguage(input), [input]);
  const effectiveSourceLang: LangCode =
    sourceSelection === "auto" ? detectedLang ?? "fr" : sourceSelection;

  const output = useMemo(() => {
    if (!input.trim()) return "";
    let result = translateFormula(input, effectiveSourceLang, targetLang);
    if (separatorsSwapped) result = swapSeparators(result);
    return result;
  }, [input, effectiveSourceLang, targetLang, separatorsSwapped]);

  function handleSwapLanguages() {
    setInput(output || input);
    setSourceSelection(targetLang);
    setTargetLang(effectiveSourceLang);
    setSeparatorsSwapped(false);
  }

  const adInterstitial = useAdInterstitial();

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 1500);
      adInterstitial.trigger();
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{tt.title}</h1>
      <p className="mb-6 mt-1.5 text-sm text-slate-500">
        {tt.subtitleStart}
        {LANGUAGES.length}
        {tt.subtitleEnd}
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {tt.sourceLangLabel}
            </label>
            <select
              value={sourceSelection}
              onChange={(e) => setSourceSelection(e.target.value as SourceSelection)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="auto">
                🌐 {tt.autoDetect}{detectedLang ? ` (${detectedLang.toUpperCase()})` : ""}
              </option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapLanguages}
            disabled={!output}
            title={tt.swapLanguagesTitle}
            className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ⇄
          </button>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {tt.targetLangLabel}
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LangCode)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setSeparatorsSwapped((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              separatorsSwapped
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tt.swapSeparators}{separatorsSwapped ? " ✓" : ""}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {tt.sourceFormulaLabel}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'=SI(RECHERCHEV(A1;B:C;2;FAUX)>10;"Grand";"Petit")'}
              rows={8}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-500">{tt.resultLabel}</label>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-medium hover:text-brand-700 disabled:opacity-40 ${
                  copyError ? "text-red-600" : "text-brand-600"
                }`}
              >
                {copyError ? tt.copyFailed : copied ? tt.copied : tt.copy}
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              rows={8}
              placeholder={tt.resultPlaceholder}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {["zh", "ja"].some((l) => l === effectiveSourceLang || l === targetLang) && (
          <p className="mt-3 text-xs text-slate-400">ℹ️ {tt.cjkNote}</p>
        )}

        {separatorsSwapped && (
          <p className="mt-3 text-xs text-amber-600">⚠️ {tt.separatorWarning}</p>
        )}
      </div>

      <AdInterstitialModal open={adInterstitial.open} onClose={adInterstitial.close} />
    </div>
  );
}
