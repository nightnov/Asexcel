"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "@/app/landing.module.css";
import { LOCALES, useLocale, type Locale } from "@/components/LocaleProvider";

/** Native name for every locale the dictionary actually covers. Only
 * languages with real translated content appear here — listing a language
 * with no dictionary behind it would be a switch that silently does
 * nothing, which is worse than not offering it at all.
 *
 * Deliberately no flag icons: flag emoji render as bare two-letter region
 * codes (FR, GB, ES...) on platforms without color-emoji font support
 * (e.g. plain Windows), which looks like a rendering bug, not a flag. */
const LOCALE_INFO: Record<Locale, { name: string }> = {
  fr: { name: "Français" },
  en: { name: "English" },
  es: { name: "Español" },
  de: { name: "Deutsch" },
  pt: { name: "Português" },
  it: { name: "Italiano" },
  nl: { name: "Nederlands" },
  pl: { name: "Polski" },
  tr: { name: "Türkçe" },
  ru: { name: "Русский" },
  ar: { name: "العربية" },
  ja: { name: "日本語" },
  zh: { name: "中文" },
  ko: { name: "한국어" },
};

/** iLovePDF-style multi-column language popover: a clean grid of native
 * language names instead of a single-column dropdown, so scaling to more
 * languages later doesn't turn into a long scrolling list. */
function LanguageSwitcher({ dark }: { dark?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-sm transition-colors duration-150 ${
          dark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        {LOCALE_INFO[locale].name}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          className={`absolute bottom-full right-0 mb-2 w-[22rem] overflow-hidden rounded-2xl border p-3 shadow-xl ${
            dark ? "border-white/10 bg-[#121712] backdrop-blur-xl" : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider ${
              dark ? "text-white/30" : "text-slate-400"
            }`}
          >
            Choisir la langue
          </p>
          <div className="grid max-h-80 grid-cols-3 gap-1 overflow-y-auto">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={`flex items-center justify-between gap-1 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 ${
                  code === locale
                    ? dark
                      ? "bg-[#1E8E5A]/20 font-medium text-[#34D399]"
                      : "bg-brand-50 font-medium text-brand-700"
                    : dark
                      ? "text-white/60 hover:bg-white/5"
                      : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{LOCALE_INFO[code].name}</span>
                {code === locale && (
                  <span className={`shrink-0 ${dark ? "text-[#34D399]" : "text-brand-600"}`}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingFooter({ dark = false }: { dark?: boolean }) {
  const { t } = useLocale();

  const linkClass = dark
    ? "transition-colors duration-150 text-white/50 hover:text-white"
    : "transition-colors duration-150 hover:text-slate-900";
  const headingClass = `text-sm font-bold uppercase tracking-wider ${dark ? "text-white" : "text-slate-900"}`;

  return (
    <footer
      className={`w-full py-12 ${
        dark ? "border-t border-white/10 bg-[#0B0F0D]" : "border-t border-slate-100 bg-white"
      }`}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 px-4 md:grid-cols-5">
        {/* Bloc 1 : Logo & Description — même composant que la Navbar */}
        <div className="space-y-3 md:col-span-1">
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoBadge}>
              <img src="/logo-transparent.png" alt="Asexcel" />
            </span>
            <span className={`${styles.brandText} ${styles.brandName} ${dark ? "!text-white" : ""}`}>
              Asexcel
            </span>
          </Link>
          <p className={`text-sm ${dark ? "text-white/50" : "text-slate-500"}`}>{t.footer.tagline}</p>
        </div>

        {/* Les 4 colonnes alignées */}
        <div className="grid grid-cols-2 gap-8 md:col-span-4 md:grid-cols-4">
          {/* Colonne PRODUIT */}
          <div className="flex flex-col gap-4">
            <h3 className={headingClass}>{t.footer.colProduit}</h3>
            <ul className={`flex flex-col gap-2 text-sm ${dark ? "text-white/60" : "text-slate-600"}`}>
              <li><Link href="/" className={linkClass}>{t.footer.accueil}</Link></li>
              <li><Link href="/#outils" className={linkClass}>{t.footer.fonctionnalites}</Link></li>
              <li><Link href="/tarifs" className={linkClass}>{t.footer.tarification}</Link></li>
              <li><Link href="/#outils" className={linkClass}>{t.footer.outilsLink}</Link></li>
              <li><Link href="/#faq" className={linkClass}>{t.footer.faq}</Link></li>
            </ul>
          </div>

          {/* Colonne JURIDIQUE */}
          <div className="flex flex-col gap-4">
            <h3 className={headingClass}>{t.footer.colJuridique}</h3>
            <ul className={`flex flex-col gap-2 text-sm ${dark ? "text-white/60" : "text-slate-600"}`}>
              <li><Link href="/securite" className={linkClass}>{t.footer.securite}</Link></li>
              <li><Link href="/confidentialite" className={linkClass}>{t.footer.confidentialite}</Link></li>
              <li><Link href="/conditions" className={linkClass}>{t.footer.conditions}</Link></li>
              <li><Link href="/cookies" className={linkClass}>{t.footer.cookies}</Link></li>
            </ul>
          </div>

          {/* Colonne OUTILS */}
          <div className="flex flex-col gap-4">
            <h3 className={headingClass}>{t.footer.colOutils}</h3>
            <ul className={`flex flex-col gap-2 text-sm ${dark ? "text-white/60" : "text-slate-600"}`}>
              <li><Link href="/outils/nettoyeur" className={linkClass}>{t.footer.nettoyage}</Link></li>
              <li><Link href="/outils/convertisseur" className={linkClass}>{t.footer.conversion}</Link></li>
              <li><Link href="/outils/fusionneur" className={linkClass}>{t.footer.fusion}</Link></li>
              <li><Link href="/outils/diviseur" className={linkClass}>{t.footer.division}</Link></li>
              <li><Link href="/outils/generateur-formules" className={linkClass}>{t.footer.generateurFormules}</Link></li>
              <li><Link href="/outils/formules" className={linkClass}>{t.footer.traduction}</Link></li>
              <li><Link href="/outils/comparateur" className={linkClass}>{t.footer.comparaison}</Link></li>
              <li><Link href="/outils/securite" className={linkClass}>{t.footer.securiteOutil}</Link></li>
              <li><Link href="/outils/test-qi" className={linkClass}>{t.footer.testQi}</Link></li>
            </ul>
          </div>

          {/* Colonne ENTREPRISE */}
          <div className="flex flex-col gap-4">
            <h3 className={headingClass}>{t.footer.colEntreprise}</h3>
            <ul className={`flex flex-col gap-2 text-sm ${dark ? "text-white/60" : "text-slate-600"}`}>
              <li><Link href="/a-propos" className={linkClass}>{t.footer.aPropos}</Link></li>
              <li><Link href="/outils/support" className={linkClass}>{t.footer.contact}</Link></li>
              <li><Link href="/blog" className={linkClass}>{t.footer.blog}</Link></li>
              <li><Link href="/presse" className={linkClass}>{t.footer.presse}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t px-4 pt-6 text-sm ${
          dark ? "border-white/10 text-white/40" : "border-slate-100 text-slate-500"
        }`}
      >
        <span>{t.footer.copyright}</span>
        <LanguageSwitcher dark={dark} />
      </div>
    </footer>
  );
}
