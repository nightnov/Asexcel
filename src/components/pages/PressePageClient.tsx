"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { useLocale } from "@/components/LocaleProvider";

export default function PressePageClient() {
  const { t } = useLocale();
  const p = t.pages.presse;

  return (
    <LegalPageShell title={p.title} showUpdatedAt={false}>
      <p>
        {p.introPrefix}{" "}
        <a href="/outils/support" className="text-brand-600 underline hover:text-brand-700">
          {p.introLinkLabel}
        </a>{" "}
        {p.introSuffix}
      </p>
      <div className="rounded-2xl bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">{p.empty}</p>
      </div>
    </LegalPageShell>
  );
}
