"use client";

import { useRef, useState } from "react";
import { validateExcelFile } from "@/lib/validation";
import {
  splitBySheet,
  splitByRowChunks,
  triggerDownload,
  downloadAsZip,
  type SplitMode,
  type SplitFile,
} from "@/lib/fileMergeSplit";
import { useLocale } from "@/components/LocaleProvider";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function FileSplitter() {
  const { t } = useLocale();
  const tt = t.tools.division;

  const [splitSource, setSplitSource] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("rows");
  const [chunkSize, setChunkSize] = useState(500);
  const [splitting, setSplitting] = useState(false);
  const [splitResults, setSplitResults] = useState<SplitFile[]>([]);
  const [splitError, setSplitError] = useState<string | null>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);

  function handleSplitFileSelected(file: File | undefined) {
    if (!file) return;
    const validation = validateExcelFile(file);
    if (!validation.ok) {
      setSplitError(validation.error ?? t.chat.invalidFileDefault);
      return;
    }
    setSplitSource(file);
    setSplitResults([]);
    setSplitError(null);
  }

  async function handleSplit() {
    if (!splitSource) return;
    setSplitting(true);
    setSplitError(null);
    try {
      const results =
        splitMode === "sheet" ? await splitBySheet(splitSource) : await splitByRowChunks(splitSource, chunkSize);

      if (results.length === 0) {
        setSplitError(tt.noDataToSplit);
      }
      setSplitResults(results);
    } catch {
      setSplitError(tt.cannotSplit);
    } finally {
      setSplitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{tt.title}</h1>
      <p className="mb-6 mt-1.5 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div
            onClick={() => splitInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:bg-slate-50"
          >
            <p className="text-sm text-slate-600">
              {splitSource ? `📄 ${splitSource.name}` : tt.chooseFilePrompt}
            </p>
            <p className="mt-1 text-xs text-slate-400">.xlsx, .xls, .csv</p>
            <input
              ref={splitInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                handleSplitFileSelected(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSplitMode("sheet")}
                className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                  splitMode === "sheet" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                {tt.bySheet}
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("rows")}
                className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                  splitMode === "rows" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                {tt.byRows}
              </button>
            </div>

            {splitMode === "rows" && (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                {tt.everyLabel}
                <input
                  type="number"
                  min={1}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {tt.rowsLabel}
              </label>
            )}
          </div>

          {splitError && <p className="text-sm text-red-600">{splitError}</p>}

          <button
            type="button"
            onClick={handleSplit}
            disabled={!splitSource || splitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {splitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {splitting ? tt.splitting : tt.splitCta}
          </button>

          {splitResults.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-slate-700">
                  ✅ {splitResults.length}{" "}
                  {splitResults.length > 1 ? tt.fileGeneratedPlural : tt.fileGeneratedSingular}
                </p>
                <button
                  type="button"
                  onClick={() => downloadAsZip(splitResults, `${splitSource?.name.replace(/\.[^.]+$/, "") ?? "decoupe"}.zip`)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
                >
                  📦 {tt.downloadAll}
                </button>
              </div>
              <ul className="space-y-1.5">
                {splitResults.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="truncate text-slate-700">
                      📄 {f.name} <span className="text-xs text-slate-400">({formatBytes(f.blob.size)})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerDownload(f.blob, f.name)}
                      className="ml-2 shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {tt.download}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
