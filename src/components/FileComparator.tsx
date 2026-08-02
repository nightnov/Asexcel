"use client";

import { useRef, useState, type DragEvent } from "react";
import { validateExcelFile } from "@/lib/validation";
import {
  getSheetNames,
  compareFiles,
  buildDiffReportBlob,
  triggerDownload,
  type CompareResult,
  type DiffStatus,
} from "@/lib/fileCompare";
import { useLocale } from "@/components/LocaleProvider";

type Slot = "a" | "b";

type FilterMode = "all" | "diff";

const STATUS_BADGE_CLASSES: Record<DiffStatus, string> = {
  modified: "bg-amber-50 text-amber-700",
  added: "bg-emerald-50 text-emerald-700",
  removed: "bg-rose-50 text-rose-700",
  unchanged: "bg-slate-100 text-slate-500",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function pickMatchingSheet(names: string[], preferred: string | null): string {
  if (preferred && names.includes(preferred)) return preferred;
  return names[0] ?? "";
}

export default function FileComparator() {
  const { t } = useLocale();
  const tt = t.tools.comparateur;

  const STATUS_LABELS: Record<DiffStatus, string> = {
    modified: tt.statusModified,
    added: tt.statusAdded,
    removed: tt.statusRemoved,
    unchanged: tt.statusUnchanged,
  };

  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [sheetsA, setSheetsA] = useState<string[]>([]);
  const [sheetsB, setSheetsB] = useState<string[]>([]);
  const [sheetA, setSheetA] = useState("");
  const [sheetB, setSheetB] = useState("");
  const [draggingA, setDraggingA] = useState(false);
  const [draggingB, setDraggingB] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("diff");

  const inputA = useRef<HTMLInputElement>(null);
  const inputB = useRef<HTMLInputElement>(null);

  async function handleFileSelected(slot: Slot, file: File | undefined) {
    if (!file) return;
    const validation = validateExcelFile(file);
    if (!validation.ok) {
      setError(`${file.name} : ${validation.error}`);
      return;
    }

    setError(null);
    setResult(null);

    try {
      const names = await getSheetNames(file);
      if (slot === "a") {
        setFileA(file);
        setSheetsA(names);
        setSheetA((prev) => pickMatchingSheet(names, prev || (sheetB || null)));
      } else {
        setFileB(file);
        setSheetsB(names);
        setSheetB((prev) => pickMatchingSheet(names, prev || (sheetA || null)));
      }
    } catch {
      setError(`${file.name} : ${tt.cannotReadFile}`);
    }
  }

  function handleDrop(slot: Slot, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (slot === "a") setDraggingA(false);
    else setDraggingB(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFileSelected(slot, file);
  }

  async function handleCompare() {
    if (!fileA || !fileB || !sheetA || !sheetB) return;
    setComparing(true);
    setError(null);
    try {
      const res = await compareFiles(fileA, sheetA, fileB, sheetB);
      setResult(res);
    } catch {
      setError(tt.cannotCompare);
    } finally {
      setComparing(false);
    }
  }

  async function handleDownloadReport() {
    if (!result) return;
    const blob = await buildDiffReportBlob(result);
    triggerDownload(blob, "rapport-differences.xlsx");
  }

  const visibleEntries = result
    ? filterMode === "diff"
      ? result.entries.filter((e) => e.status !== "unchanged")
      : result.entries
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{tt.title}</h1>
      <p className="mb-6 mt-1.5 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["a", "b"] as const).map((slot) => {
            const file = slot === "a" ? fileA : fileB;
            const sheets = slot === "a" ? sheetsA : sheetsB;
            const selectedSheet = slot === "a" ? sheetA : sheetB;
            const dragging = slot === "a" ? draggingA : draggingB;
            const inputRef = slot === "a" ? inputA : inputB;
            const label = slot === "a" ? tt.fileALabel : tt.fileBLabel;

            return (
              <div key={slot} className="space-y-2">
                <p className="text-xs font-medium text-slate-600">{label}</p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (slot === "a") setDraggingA(true);
                    else setDraggingB(true);
                  }}
                  onDragLeave={() => (slot === "a" ? setDraggingA(false) : setDraggingB(false))}
                  onDrop={(e) => handleDrop(slot, e)}
                  onClick={() => inputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                    dragging ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm text-slate-600">
                    {file ? `📄 ${file.name}` : tt.dropzonePrompt}
                  </p>
                  {file && <p className="mt-1 text-xs text-slate-400">({formatBytes(file.size)})</p>}
                  {!file && <p className="mt-1 text-xs text-slate-400">.xlsx, .xls, .csv</p>}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      void handleFileSelected(slot, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>

                {sheets.length > 0 && (
                  <select
                    value={selectedSheet}
                    onChange={(e) => (slot === "a" ? setSheetA(e.target.value) : setSheetB(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {sheets.map((name) => (
                      <option key={name} value={name}>
                        {tt.sheetPrefix} {name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleCompare}
          disabled={!fileA || !fileB || !sheetA || !sheetB || comparing}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {comparing && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {comparing ? tt.comparing : tt.compareCta}
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                🔍 <strong>{result.summary.modified}</strong>{" "}
                {result.summary.modified > 1 ? tt.modifiedPlural : tt.modifiedSingular} ·{" "}
                <strong>{result.summary.added}</strong>{" "}
                {result.summary.added > 1 ? tt.addedPlural : tt.addedSingular} ·{" "}
                <strong>{result.summary.removed}</strong>{" "}
                {result.summary.removed > 1 ? tt.removedPlural : tt.removedSingular}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                    filterMode === "all" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {tt.viewAll}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("diff")}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                    filterMode === "diff" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {tt.viewDiffOnly}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
              >
                📥 {tt.downloadReport}
              </button>
            </div>

            <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">{tt.cellHeader}</th>
                    <th className="px-3 py-2 font-medium">{tt.oldValueHeader}</th>
                    <th className="px-3 py-2 font-medium">{tt.newValueHeader}</th>
                    <th className="px-3 py-2 font-medium">{tt.statusHeader}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-400">
                        {tt.noDiff}
                      </td>
                    </tr>
                  ) : (
                    visibleEntries.map((entry) => (
                      <tr key={entry.cellRef} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{entry.cellRef}</td>
                        <td
                          className={`px-3 py-2 ${
                            entry.status === "modified" || entry.status === "removed"
                              ? "bg-rose-50 text-rose-700"
                              : "text-slate-700"
                          }`}
                        >
                          {entry.oldValue || <span className="text-slate-300">—</span>}
                        </td>
                        <td
                          className={`px-3 py-2 ${
                            entry.status === "modified" || entry.status === "added"
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-700"
                          }`}
                        >
                          {entry.newValue || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLASSES[entry.status]}`}
                          >
                            {STATUS_LABELS[entry.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
