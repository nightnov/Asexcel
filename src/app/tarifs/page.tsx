import { buildMetadata } from "@/lib/seo";
import TarifsPageClient from "@/components/pages/TarifsPageClient";

export const metadata = buildMetadata({
  title: "Tarifs — Asexcel",
  description: "Découvrez les plans Asexcel : outils gratuits sans compte, plan Membre gratuit, et plan Pro pour un assistant IA illimité.",
  path: "/tarifs",
});

export default function TarifsPage() {
  return <TarifsPageClient />;
}
