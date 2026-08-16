"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { ShieldIcon, LockIcon } from "@/components/icons/ToolIcons";
import { useLocale } from "@/components/LocaleProvider";

export default function SecuritePageClient() {
  const { t } = useLocale();
  const p = t.pages.securite;

  return (
    <LegalPageShell title={p.title}>
      <p>{p.intro}</p>

      <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-brand-50 p-4">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm leading-relaxed text-slate-600">{p.localProcessingNote}</p>
      </div>

      <h2 className="text-lg font-semibold text-ink">{p.encryptionTitle}</h2>
      <p>{p.encryptionText}</p>

      <h2 className="text-lg font-semibold text-ink">{p.passwordTitle}</h2>
      <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm leading-relaxed text-slate-600">
          {p.passwordTextPrefix}{" "}
          <a href="/outils/securite" className="text-brand-600 underline hover:text-brand-700">
            {p.passwordToolLink}
          </a>{" "}
          {p.passwordTextSuffix}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-ink">{p.authTitle}</h2>
      <p>{p.authText}</p>

      <h2 className="text-lg font-semibold text-ink">{p.reportTitle}</h2>
      <p>
        {p.reportTextPrefix}{" "}
        <a href="/outils/support" className="text-brand-600 underline hover:text-brand-700">
          {p.reportLinkLabel}
        </a>
        {p.reportTextSuffix}
      </p>
    </LegalPageShell>
  );
}
