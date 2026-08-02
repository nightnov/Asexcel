"use client";

import { useRef, useState } from "react";
import { validateExcelFile } from "@/lib/validation";
import { analyzeSpreadsheetFile, type FileAnalysis } from "@/lib/fileAnalysis";
import { useLocale } from "@/components/LocaleProvider";

interface FileUploadProps {
  onAnalyzed: (analysis: FileAnalysis) => void;
  disabled?: boolean;
}

/**
 * Reads the selected spreadsheet/CSV entirely client-side (SheetJS) — no
 * network call, no server storage, no anti-abuse gate needed since nothing
 * leaves the browser except the small structure summary handed to the AI
 * afterwards.
 */
export default function FileUpload({ onAnalyzed, disabled }: FileUploadProps) {
  const { t } = useLocale();
  const tc = t.chat;
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateExcelFile(file);
    if (!validation.ok) {
      setStatus("error");
      setError(validation.error ?? tc.invalidFileDefault);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setStatus("analyzing");
    setError(null);

    try {
      const analysis = await analyzeSpreadsheetFile(file);
      onAnalyzed(analysis);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError(tc.cannotReadFile);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 ${
          disabled || status === "analyzing" ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        {status === "analyzing" ? tc.readingFile : `📎 ${tc.joinFile}`}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
          disabled={disabled || status === "analyzing"}
        />
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
