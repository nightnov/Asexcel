"use client";

import { useRef, useState, type DragEvent } from "react";
import { validateExcelFile } from "@/lib/validation";
import { usePlan } from "@/lib/usePlan";
import { fileSizeLimitBytes, buildTooLargeMessage } from "@/lib/fileSizeLimits";
import { mergeFiles, buildXlsxBlob, triggerDownload } from "@/lib/fileMergeSplit";
import { useLocale } from "@/components/LocaleProvider";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function FileMerger() {
  const { t } = useLocale();
  const tt = t.tools.fusion;
  const fl = t.fileLimits;
  const { plan } = usePlan();
  const maxFileSize = fileSizeLimitBytes(plan);

  const [mergeQueue, setMergeQueue] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeSummary, setMergeSummary] = useState<{ headers: string[]; rows: string[][]; fileCount: number } | null>(
    null
  );
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  function addMergeFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      const validation = validateExcelFile(file, maxFileSize);
      if (validation.ok) {
        valid.push(file);
      } else if (validation.sizeExceeded) {
        errors.push(buildTooLargeMessage(fl, plan, validation.sizeExceeded.limitBytes, file.name));
      } else {
        errors.push(`${file.name} : ${validation.error}`);
      }
    }

    setMergeQueue((prev) => [...prev, ...valid]);
    setMergeSummary(null);
    setMergeError(errors.length ? errors.join(" / ") : null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) addMergeFiles(event.dataTransfer.files);
  }

  function removeMergeFile(index: number) {
    setMergeQueue((prev) => prev.filter((_, i) => i !== index));
    setMergeSummary(null);
  }

  async function handleMerge() {
    if (mergeQueue.length === 0) return;
    setMerging(true);
    setMergeError(null);
    try {
      const result = await mergeFiles(mergeQueue);
      setMergeSummary(result);
    } catch {
      setMergeError(tt.cannotMerge);
    } finally {
      setMerging(false);
    }
  }

  async function handleDownloadMerged() {
    if (!mergeSummary) return;
    const blob = await buildXlsxBlob(mergeSummary.headers, mergeSummary.rows, "Fusion");
    triggerDownload(blob, "fusion.xlsx");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{tt.title}</h1>
      <p className="mb-6 mt-1.5 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => mergeInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
              isDragging ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className="text-sm text-slate-600">{tt.dropzonePrompt}</p>
            <p className="mt-1 text-xs text-slate-400">{tt.dropzoneFormats}</p>
            <input
              ref={mergeInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addMergeFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {mergeQueue.length > 0 && (
            <ul className="space-y-1.5">
              {mergeQueue.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="truncate text-slate-700">
                    📄 {file.name}{" "}
                    <span className="text-xs text-slate-400">({formatBytes(file.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMergeFile(i)}
                    className="ml-2 shrink-0 text-slate-400 hover:text-red-600"
                    title={tt.removeTitle}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mergeError && <p className="text-sm text-red-600">{mergeError}</p>}

          <button
            type="button"
            onClick={handleMerge}
            disabled={mergeQueue.length === 0 || merging}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {merging && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {merging
              ? tt.merging
              : `${tt.mergeCtaPrefix} ${mergeQueue.length || ""} ${mergeQueue.length > 1 ? tt.filePlural : tt.fileSingular}`}
          </button>

          {mergeSummary && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                ✅ {mergeSummary.fileCount} {mergeSummary.fileCount > 1 ? tt.mergedPlural : tt.mergedSingular} ·{" "}
                {mergeSummary.rows.length} {mergeSummary.rows.length > 1 ? tt.linePlural : tt.lineSingular}{" "}
                {tt.totalSuffix} · {mergeSummary.headers.length}{" "}
                {mergeSummary.headers.length > 1 ? tt.columnPlural : tt.columnSingular}
              </p>
              <button
                type="button"
                onClick={handleDownloadMerged}
                className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                📥 {tt.downloadMerged}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
