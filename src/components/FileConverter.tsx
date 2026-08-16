"use client";

import { useRef, useState, type DragEvent } from "react";
import { validateExcelFile } from "@/lib/validation";
import { usePlan } from "@/lib/usePlan";
import { fileSizeLimitBytes, buildTooLargeMessage } from "@/lib/fileSizeLimits";
import {
  getSheetNames,
  extractSheetData,
  buildCsvText,
  buildCsvBlob,
  buildJsonText,
  buildJsonBlob,
  buildPdfBlob,
  triggerDownload,
  outputFileName,
  type SheetData,
  type CsvSeparator,
} from "@/lib/fileConvert";
import { useLocale } from "@/components/LocaleProvider";
import { useAdInterstitial } from "@/lib/useAdInterstitial";
import AdInterstitialModal from "@/components/AdInterstitialModal";

type OutputFormat = "pdf" | "csv" | "json";

const PREVIEW_ROWS = 5;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function FileConverter() {
  const { t } = useLocale();
  const tt = t.tools.conversion;
  const fl = t.fileLimits;
  const { plan } = usePlan();
  const maxFileSize = fileSizeLimitBytes(plan);

  const FORMAT_TABS: { value: OutputFormat; label: string }[] = [
    { value: "pdf", label: "PDF" },
    { value: "csv", label: "CSV" },
    { value: "json", label: "JSON" },
  ];

  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [format, setFormat] = useState<OutputFormat>("csv");
  const [csvSeparator, setCsvSeparator] = useState<CsvSeparator>(",");
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  async function loadSheetData(sourceFile: File, sheetName: string) {
    setLoadingSheet(true);
    setError(null);
    try {
      const data = await extractSheetData(sourceFile, sheetName);
      setSheetData(data);
    } catch {
      setError(tt.cannotReadSheet);
      setSheetData(null);
    } finally {
      setLoadingSheet(false);
    }
  }

  async function handleFileSelected(selected: File | undefined) {
    if (!selected) return;
    const validation = validateExcelFile(selected, maxFileSize);
    if (!validation.ok) {
      setError(
        validation.sizeExceeded
          ? buildTooLargeMessage(fl, plan, validation.sizeExceeded.limitBytes, selected.name)
          : `${selected.name} : ${validation.error}`
      );
      return;
    }

    setError(null);
    setFile(selected);
    setSheetData(null);

    try {
      const names = await getSheetNames(selected);
      setSheets(names);
      const first = names[0] ?? "";
      setSelectedSheet(first);
      if (first) await loadSheetData(selected, first);
    } catch {
      setError(`${selected.name} : ${tt.cannotReadFile}`);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void handleFileSelected(dropped);
  }

  async function handleSheetChange(sheetName: string) {
    setSelectedSheet(sheetName);
    if (file) await loadSheetData(file, sheetName);
  }

  const adInterstitial = useAdInterstitial();

  async function handleConvertAndDownload() {
    if (!file || !sheetData) return;
    setConverting(true);
    setError(null);
    try {
      if (format === "csv") {
        triggerDownload(buildCsvBlob(sheetData, csvSeparator), outputFileName(file.name, "csv"));
      } else if (format === "json") {
        triggerDownload(buildJsonBlob(sheetData), outputFileName(file.name, "json"));
      } else {
        const blob = await buildPdfBlob(sheetData, selectedSheet || file.name);
        triggerDownload(blob, outputFileName(file.name, "pdf"));
      }
      adInterstitial.trigger();
    } catch {
      setError(tt.conversionFailed);
    } finally {
      setConverting(false);
    }
  }

  const previewRows = sheetData ? sheetData.rows.slice(0, PREVIEW_ROWS) : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{tt.title}</h1>
      <p className="mb-6 mt-1.5 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
            isDragging ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:bg-slate-50"
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
              void handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {file && sheets.length > 0 && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-slate-600">{tt.sheetToConvert}</label>
              <select
                value={selectedSheet}
                onChange={(e) => void handleSheetChange(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {sheets.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">{tt.targetFormat}</p>
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-sm">
                {FORMAT_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFormat(tab.value)}
                    className={`rounded-md px-4 py-1.5 font-medium transition ${
                      format === tab.value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {format === "csv" && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">{tt.separator}</p>
                <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-sm">
                  {(
                    [
                      { value: "," as CsvSeparator, label: tt.commaLabel },
                      { value: ";" as CsvSeparator, label: tt.semicolonLabel },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCsvSeparator(opt.value)}
                      className={`rounded-md px-3 py-1.5 font-medium transition ${
                        csvSeparator === opt.value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingSheet ? (
              <p className="text-sm text-slate-400">{tt.readingSheet}</p>
            ) : sheetData && sheetData.rows.length === 0 ? (
              <p className="text-sm text-slate-400">{tt.noDataInSheet}</p>
            ) : sheetData ? (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">
                  {tt.previewLabel} ({Math.min(PREVIEW_ROWS, sheetData.rows.length)} / {sheetData.rows.length}{" "}
                  {sheetData.rows.length > 1 ? tt.linePlural : tt.lineSingular})
                </p>

                {format === "json" ? (
                  <pre className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    {buildJsonText({ headers: sheetData.headers, rows: previewRows })}
                  </pre>
                ) : format === "csv" ? (
                  <pre className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    {buildCsvText({ headers: sheetData.headers, rows: previewRows }, csvSeparator)}
                  </pre>
                ) : (
                  <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          {sheetData.headers.map((h, i) => (
                            <th key={i} className="px-2.5 py-1.5 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            {row.map((cell, j) => (
                              <td key={j} className="px-2.5 py-1.5 text-slate-700">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleConvertAndDownload}
              disabled={!sheetData || sheetData.rows.length === 0 || converting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {converting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {converting ? tt.converting : tt.convertCta}
            </button>
          </div>
        )}
      </div>

      <AdInterstitialModal open={adInterstitial.open} onClose={adInterstitial.close} />
    </div>
  );
}
