import { buildMetadata } from "@/lib/seo";
import CookiesPageClient from "@/components/pages/CookiesPageClient";

export const metadata = buildMetadata({
  title: "Politique de cookies — Asexcel",
  description: "Quels cookies Asexcel utilise (session, langue, publicité) et comment les gérer.",
  path: "/cookies",
});

export default function CookiesPage() {
  return <CookiesPageClient />;
}
