import Link from "next/link";
import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooter from "@/components/LandingFooter";
import styles from "@/app/landing.module.css";
import { poppins, inter } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Page introuvable | Asexcel",
  description: "Cette page n'existe pas ou plus. Retrouvez tous les outils Asexcel depuis l'accueil.",
  robots: { index: false, follow: true },
};

const POPULAR_LINKS = [
  { href: "/chat", label: "Assistance IA" },
  { href: "/outils/nettoyeur", label: "Nettoyage de données" },
  { href: "/outils/convertisseur", label: "Conversion de fichiers" },
  { href: "/outils/generateur-formules", label: "Générateur de formules" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/outils/support", label: "Contacter le support" },
];

export default function NotFound() {
  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable}`}>
      <LandingHeader />

      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center px-4 py-20 text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">Erreur 404</span>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-500">
          Le lien que vous avez suivi est peut-être incorrect, ou la page a été déplacée ou supprimée.
          Vous pouvez retourner à l&apos;accueil ou choisir un de nos outils ci-dessous.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Retour à l&apos;accueil
        </Link>

        <div className="mt-12 w-full text-left">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
            Pages populaires
          </h2>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {POPULAR_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {link.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
