"use client";

import LegalPageShell from "@/components/LegalPageShell";
import { useLocale } from "@/components/LocaleProvider";

export default function ConfidentialitePage() {
  const { t } = useLocale();
  const c = t.pages.confidentialite;

  return (
    <LegalPageShell title={c.title}>
      <p>{c.intro}</p>

      <h2 className="text-lg font-semibold text-ink">{c.s1.title}</h2>
      <p>
        {c.s1.text}{" "}
        <a href="/outils/support" className="text-brand-600 underline hover:text-brand-700">
          {c.supportLink}
        </a>
        .
      </p>

      <h2 className="text-lg font-semibold text-ink">{c.s2.title}</h2>
      <p>{c.s2.text1}</p>
      <p>{c.s2.text2}</p>
      <p>{c.s2.text3}</p>

      <h2 className="text-lg font-semibold text-ink">{c.s3.title}</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        {c.s3.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold text-ink">{c.s4.title}</h2>
      <p>{c.s4.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.s5.title}</h2>
      <p>{c.s5.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.s6.title}</h2>
      <p>{c.s6.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.s7.title}</h2>
      <p>{c.s7.intro}</p>
      <ul className="list-disc space-y-1.5 pl-5">
        {c.s7.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <p>
        {c.s7.outro.split("{support}")[0]}
        <a href="/outils/support" className="text-brand-600 underline hover:text-brand-700">
          {c.supportLink}
        </a>
        {c.s7.outro.split("{support}")[1]}
      </p>

      <h2 className="text-lg font-semibold text-ink">{c.s8.title}</h2>
      <p>
        {c.s8.text.split("{securite}")[0]}
        <a href="/securite" className="text-brand-600 underline hover:text-brand-700">
          {c.securiteLink}
        </a>
        {c.s8.text.split("{securite}")[1]}
      </p>

      <h2 className="text-lg font-semibold text-ink">{c.s9.title}</h2>
      <p>{c.s9.text}</p>

      <h2 className="text-lg font-semibold text-ink">{c.s10.title}</h2>
      <p>{c.s10.text}</p>
    </LegalPageShell>
  );
}
