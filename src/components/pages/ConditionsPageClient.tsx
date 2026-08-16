"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { useLocale } from "@/components/LocaleProvider";

export default function ConditionsPageClient() {
  const { t } = useLocale();
  const c = t.pages.conditions;

  return (
    <LegalPageShell title={c.title}>
      <p>{c.intro}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a1.title}</h2>
      <p>{c.a1.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a2.title}</h2>
      <p>{c.a2.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a3.title}</h2>
      <p>{c.a3.intro}</p>
      <ul className="list-disc space-y-1.5 pl-5">
        {c.a3.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold text-ink">{c.a4.title}</h2>
      <p>{c.a4.text1}</p>
      <p>{c.a4.text2}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a5.title}</h2>
      <p>{c.a5.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.aSub.title}</h2>
      <p>{c.aSub.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a6.title}</h2>
      <p>{c.a6.intro}</p>
      <ul className="list-disc space-y-1.5 pl-5">
        {c.a6.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold text-ink">{c.a7.title}</h2>
      <p>{c.a7.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a8.title}</h2>
      <p>
        {c.a8.text.split("{confidentialite}")[0]}
        <a href="/confidentialite" className="text-brand-600 underline hover:text-brand-700">
          {c.confidentialiteLink}
        </a>
        {c.a8.text.split("{confidentialite}")[1]}
      </p>

      <h2 className="text-lg font-semibold text-ink">{c.a9.title}</h2>
      <p>{c.a9.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.a10.title}</h2>
      <p>
        {c.a10.text.split("{support}")[0]}
        <a href="/outils/support" className="text-brand-600 underline hover:text-brand-700">
          {c.supportLink}
        </a>
        {c.a10.text.split("{support}")[1]}
      </p>
    </LegalPageShell>
  );
}
