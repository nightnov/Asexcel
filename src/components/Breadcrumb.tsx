"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** French label for every /outils/* route. New tool pages need one entry
 * here to get a breadcrumb — everything else (icon, position) is derived
 * automatically from the URL. */
const TOOL_LABELS: Record<string, string> = {
  "/outils": "Outils",
  "/outils/nettoyeur": "Nettoyage",
  "/outils/formules": "Traduction de formules",
  "/outils/generateur-formules": "Générateur de formules",
  "/outils/comparateur": "Comparaison",
  "/outils/convertisseur": "Conversion",
  "/outils/securite": "Sécurité",
  "/outils/fusionneur": "Fusion",
  "/outils/diviseur": "Division",
  "/outils/test-qi": "Test de Q.I.",
  "/outils/support": "Support",
};

/**
 * Accueil > Outils > [Page]. Reads the current label from TOOL_LABELS via
 * usePathname so every ToolPageShell consumer gets a breadcrumb for free,
 * without threading a new prop through every page.tsx call site.
 */
export default function Breadcrumb() {
  const pathname = usePathname();
  const label = TOOL_LABELS[pathname];
  if (!label || pathname === "/outils") return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asexcel.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Outils", item: `${siteUrl}/#outils` },
      { "@type": "ListItem", position: 3, name: label, item: `${siteUrl}${pathname}` },
    ],
  };

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600">
          Accueil
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/#outils" className="hover:text-slate-600">
          Outils
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-600">{label}</span>
      </nav>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
