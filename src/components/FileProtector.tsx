"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  createProtectedZip,
  extractProtectedZip,
  triggerDownload,
  outputZipName,
  isUnsupportedFileError,
  isInvalidPasswordError,
} from "@/lib/fileProtect";
import { LockIcon } from "@/components/icons/ToolIcons";
import { useLocale } from "@/components/LocaleProvider";
import { usePlan } from "@/lib/usePlan";
import { fileSizeLimitBytes, buildTooLargeMessage } from "@/lib/fileSizeLimits";
import { useAdInterstitial } from "@/lib/useAdInterstitial";
import AdInterstitialModal from "@/components/AdInterstitialModal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Tab = "protect" | "unlock";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function Dropzone({
  file,
  hint,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  inputRef,
  accept,
  onFileSelected,
  tt,
}: {
  file: File | null;
  hint: string;
  isDragging: boolean;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  accept: string;
  onFileSelected: (file: File | undefined) => void;
  tt: Dictionary["tools"]["securite"];
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
        isDragging ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:bg-slate-50"
      }`}
    >
      <p className="text-sm text-slate-600">
        {file ? `📄 ${file.name}` : tt.dropzonePrompt.replace("{hint}", hint)}
      </p>
      {file && <p className="mt-1 text-xs text-slate-400">({formatBytes(file.size)})</p>}
      {!file && <p className="mt-1 text-xs text-slate-400">{tt.dropzoneOnly.replace("{hint}", hint)}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onFileSelected(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function FileProtector() {
  const { t } = useLocale();
  const tt = t.tools.securite;
  const fl = t.fileLimits;
  const { plan } = usePlan();
  const maxFileSize = fileSizeLimitBytes(plan);

  const TABS: { value: Tab; label: string }[] = [
    { value: "protect", label: tt.tabProtect },
    { value: "unlock", label: tt.tabUnlock },
  ];

  function validateSourceFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".xlsx")) return tt.errXlsxOnly;
    if (file.size <= 0) return tt.errEmpty;
    if (file.size > maxFileSize) return buildTooLargeMessage(fl, plan, maxFileSize, file.name);
    return null;
  }

  function validateZipFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".zip")) return tt.errZipOnly;
    if (file.size <= 0) return tt.errEmpty;
    if (file.size > maxFileSize) return buildTooLargeMessage(fl, plan, maxFileSize, file.name);
    return null;
  }

  const [tab, setTab] = useState<Tab>("protect");

  // Protect tab state
  const [protectFile, setProtectFile] = useState<File | null>(null);
  const [protectPassword, setProtectPassword] = useState("");
  const [protectDragging, setProtectDragging] = useState(false);
  const [protecting, setProtecting] = useState(false);
  const [protectError, setProtectError] = useState<string | null>(null);
  const [protectDone, setProtectDone] = useState(false);

  // Unlock tab state
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockDragging, setUnlockDragging] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockDone, setUnlockDone] = useState<string | null>(null);

  const protectInput = useRef<HTMLInputElement>(null);
  const unlockInput = useRef<HTMLInputElement>(null);

  function handleProtectFile(file: File | undefined) {
    if (!file) return;
    const validationError = validateSourceFile(file);
    if (validationError) {
      setProtectError(validationError);
      return;
    }
    setProtectError(null);
    setProtectDone(false);
    setProtectFile(file);
  }

  const adInterstitial = useAdInterstitial();

  async function handleProtect() {
    if (!protectFile || !protectPassword) return;
    setProtecting(true);
    setProtectError(null);
    setProtectDone(false);
    try {
      const zipBlob = await createProtectedZip(protectFile, protectPassword);
      triggerDownload(zipBlob, outputZipName(protectFile.name));
      setProtectDone(true);
      adInterstitial.trigger();
    } catch (err) {
      setProtectError(isUnsupportedFileError(err) ? err.message : tt.errProtectFailed);
    } finally {
      setProtecting(false);
    }
  }

  function handleUnlockFile(file: File | undefined) {
    if (!file) return;
    const validationError = validateZipFile(file);
    if (validationError) {
      setUnlockError(validationError);
      return;
    }
    setUnlockError(null);
    setUnlockDone(null);
    setUnlockFile(file);
  }

  async function handleUnlock() {
    if (!unlockFile || !unlockPassword) return;
    setUnlocking(true);
    setUnlockError(null);
    setUnlockDone(null);
    try {
      const { blob, fileName } = await extractProtectedZip(unlockFile, unlockPassword);
      triggerDownload(blob, fileName);
      setUnlockDone(fileName);
      adInterstitial.trigger();
    } catch (err) {
      if (isInvalidPasswordError(err)) setUnlockError(err.message);
      else setUnlockError(isUnsupportedFileError(err) ? err.message : tt.errUnlockFailed);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-ink">{tt.title}</h1>
      <p className="mb-6 mt-1.5 text-sm text-slate-500">{tt.subtitle}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5 text-sm">
          {TABS.map((tabOpt) => (
            <button
              key={tabOpt.value}
              type="button"
              onClick={() => setTab(tabOpt.value)}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition ${
                tab === tabOpt.value
                  ? "bg-brand-600 text-white shadow-soft"
                  : "text-slate-500 hover:bg-white hover:text-slate-700"
              }`}
            >
              {tabOpt.label}
            </button>
          ))}
        </div>

        {tab === "protect" ? (
          <div className="space-y-4">
            <Dropzone
              file={protectFile}
              hint=".xlsx"
              accept=".xlsx"
              isDragging={protectDragging}
              onDragOver={(e) => {
                e.preventDefault();
                setProtectDragging(true);
              }}
              onDragLeave={() => setProtectDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setProtectDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleProtectFile(dropped);
              }}
              onClick={() => protectInput.current?.click()}
              inputRef={protectInput}
              onFileSelected={handleProtectFile}
              tt={tt}
            />

            {protectError && <p className="text-sm text-red-600">{protectError}</p>}

            {protectFile && (
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">{tt.passwordLabel}</label>
                <input
                  type="password"
                  value={protectPassword}
                  onChange={(e) => {
                    setProtectPassword(e.target.value);
                    setProtectDone(false);
                  }}
                  placeholder={tt.protectPasswordPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleProtect}
              disabled={!protectFile || !protectPassword || protecting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {protecting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {protecting ? tt.protecting : tt.protectCta}
            </button>

            <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-brand-50 p-3.5">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm leading-relaxed text-slate-600">
                <strong className="font-medium text-slate-700">{tt.noteLabel}</strong> {tt.protectNote}
              </p>
            </div>

            {protectDone && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">✅ {tt.protectDone}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-600">{tt.unlockIntro}</p>

            <Dropzone
              file={unlockFile}
              hint=".zip"
              accept=".zip"
              isDragging={unlockDragging}
              onDragOver={(e) => {
                e.preventDefault();
                setUnlockDragging(true);
              }}
              onDragLeave={() => setUnlockDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setUnlockDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleUnlockFile(dropped);
              }}
              onClick={() => unlockInput.current?.click()}
              inputRef={unlockInput}
              onFileSelected={handleUnlockFile}
              tt={tt}
            />

            {unlockError && <p className="text-sm text-red-600">{unlockError}</p>}

            {unlockFile && (
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">{tt.passwordLabel}</label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setUnlockDone(null);
                  }}
                  placeholder={tt.unlockPasswordPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleUnlock}
              disabled={!unlockFile || !unlockPassword || unlocking}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {unlocking && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {unlocking ? tt.unlocking : tt.unlockCta}
            </button>

            {unlockDone && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  ✅ {tt.unlockDonePrefix} {unlockDone} {tt.unlockDoneSuffix}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <AdInterstitialModal open={adInterstitial.open} onClose={adInterstitial.close} />
    </div>
  );
}
