"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { useLocale } from "@/components/LocaleProvider";

export default function CookiesPageClient() {
  const { t } = useLocale();
  const p = t.pages.cookies;

  return (
    <LegalPageShell title={p.title}>
      <p>{p.intro}</p>

      <h2 className="text-lg font-semibold text-ink">{p.sessionTitle}</h2>
      <p>{p.sessionText}</p>

      <h2 className="text-lg font-semibold text-ink">{p.languageTitle}</h2>
      <p>{p.languageText}</p>

      <h2 className="text-lg font-semibold text-ink">{p.adsTitle}</h2>
      <p>{p.adsText}</p>
    </LegalPageShell>
  );
}
