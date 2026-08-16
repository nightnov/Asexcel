"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { useLocale } from "@/components/LocaleProvider";

export default function BlogPageClient() {
  const { t } = useLocale();
  const p = t.pages.blog;

  return (
    <LegalPageShell title={p.title} showUpdatedAt={false}>
      <div className="rounded-2xl bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">{p.empty}</p>
      </div>
    </LegalPageShell>
  );
}
