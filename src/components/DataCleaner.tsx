"use client";

import { useMemo, useState } from "react";
import {
  cleanData,
  DEFAULT_CLEAN_OPTIONS,
  type CaseMode,
  type DecimalMode,
} from "@/lib/dataCleaner";
import { useLocale } from "@/components/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useAdInterstitial } from "@/lib/useAdInterstitial";
import AdInterstitialModal from "@/components/AdInterstitialModal";

function SegmentField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              value === opt.value
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
        checked
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2.5 6l2.5 2.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

export default function DataCleaner() {
  const { t } = useLocale();
  const tt: Dictionary["tools"]["nettoyeur"] = t.tools.nettoyeur;

  const CASE_OPTIONS: { value: CaseMode; label: string }[] = [
    { value: "none", label: tt.caseNone },
    { value: "upper", label: tt.caseUpper },
    { value: "lower", label: tt.caseLower },
    { value: "proper", label: tt.caseProper },
  ];

  const DECIMAL_OPTIONS: { value: DecimalMode; label: string }[] = [
    { value: "none", label: tt.decimalNone },
    { value: "dot-to-comma", label: tt.dotToComma },
    { value: "comma-to-dot", label: tt.commaToDot },
  ];

  const [input, setInput] = useState("");
  const [options, setOptions] = useState(DEFAULT_CLEAN_OPTIONS);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo(() => cleanData(input, options), [input, options]);

  function toggle(key: "trim" | "dedupe") {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const adInterstitial = useAdInterstitial();

  async function handleCopy() {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
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
      <p className="mb-6 mt-1.5 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <ToggleField label={tt.trimLabel} checked={options.trim} onChange={() => toggle("trim")} />
          <ToggleField label={tt.dedupeLabel} checked={options.dedupe} onChange={() => toggle("dedupe")} />
          <SegmentField
            label={tt.caseLabel}
            options={CASE_OPTIONS}
            value={options.caseMode}
            onChange={(v) => setOptions((prev) => ({ ...prev, caseMode: v as CaseMode }))}
          />
          <SegmentField
            label={tt.decimalLabel}
            options={DECIMAL_OPTIONS}
            value={options.decimalMode}
            onChange={(v) => setOptions((prev) => ({ ...prev, decimalMode: v as DecimalMode }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">{tt.sourceLabel}</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tt.sourcePlaceholder}
              rows={10}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 font-mono text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-500">{tt.resultLabel}</label>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result.output}
                className={`text-xs font-medium hover:text-brand-700 disabled:opacity-40 ${
                  copyError ? "text-red-600" : "text-brand-600"
                }`}
              >
                {copyError ? tt.copyFailed : copied ? tt.copied : tt.copy}
              </button>
            </div>
            <textarea
              value={result.output}
              readOnly
              rows={10}
              placeholder={tt.resultPlaceholder}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-sm text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {input.trim() && (
          <p className="mt-3 text-xs text-slate-400">
            {result.lineCount} {result.lineCount > 1 ? tt.linePlural : tt.lineSingular}
            {options.dedupe
              ? ` · ${result.duplicatesRemoved} ${
                  result.duplicatesRemoved > 1 ? tt.duplicatePlural : tt.duplicateSingular
                }`
              : ""}
          </p>
        )}

        {options.decimalMode !== "none" && (
          <p className="mt-2 text-xs text-amber-600">⚠️ {tt.decimalWarning}</p>
        )}
      </div>

      <AdInterstitialModal open={adInterstitial.open} onClose={adInterstitial.close} />
    </div>
  );
}
