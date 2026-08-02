"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { useLocale } from "@/components/LocaleProvider";

export default function AProposPage() {
  const { t } = useLocale();
  const p = t.pages.aPropos;

  return (
    <LegalPageShell title={p.title} showUpdatedAt={false}>
      <p>{p.p1}</p>
      <p>{p.p2}</p>
      <p>{p.p3}</p>
      <p>{p.p4}</p>
    </LegalPageShell>
  );
}
