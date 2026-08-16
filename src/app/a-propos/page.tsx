import { buildMetadata } from "@/lib/seo";
import AProposPageClient from "@/components/pages/AProposPageClient";

export const metadata = buildMetadata({
  title: "À propos — Asexcel",
  description: "Découvrez Asexcel, la boîte à outils gratuite pour nettoyer, convertir, comparer et protéger vos fichiers Excel et CSV.",
  path: "/a-propos",
});

export default function AProposPage() {
  return <AProposPageClient />;
}
