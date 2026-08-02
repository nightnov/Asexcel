"use client";

import type { ReactNode } from "react";
import styles from "@/app/landing.module.css";
import { poppins, inter } from "@/lib/fonts";
import LandingHeader from "@/components/LandingHeader";
import LandingFooter from "@/components/LandingFooter";
import { useLocale } from "@/components/LocaleProvider";
import { COMPANY_INFO } from "@/lib/companyConfig";

interface LegalPageShellProps {
  title: string;
  /** Set to false for pages with no legal-revision date (e.g. À propos, Blog). */
  showUpdatedAt?: boolean;
  children: ReactNode;
}

/** Shared shell for legal/company pages (À propos, Confidentialité, Conditions,
 * Cookies, Sécurité, Blog, Presse) — same header/footer chrome and prose
 * layout everywhere so these pages read as one consistent section, not
 * ad-hoc one-offs. The "last updated" date comes from the single
 * `COMPANY_INFO.legalLastUpdated` source of truth and is formatted in the
 * viewer's active language, instead of being retyped per page/locale. */
export default function LegalPageShell({ title, showUpdatedAt = true, children }: LegalPageShellProps) {
  const { locale, t } = useLocale();
  const formattedDate = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(COMPANY_INFO.legalLastUpdated)
  );

  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable}`}>
      <LandingHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        {showUpdatedAt && (
          <p className="mt-2 text-sm text-slate-400">
            {t.legal.lastUpdated} {formattedDate}
          </p>
        )}
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-slate-600">{children}</div>
      </main>

      <LandingFooter />
    </div>
  );
}
