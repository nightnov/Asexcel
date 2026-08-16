import { buildMetadata } from "@/lib/seo";
import PressePageClient from "@/components/pages/PressePageClient";

export const metadata = buildMetadata({
  title: "Presse — Asexcel",
  description: "Ressources presse et contact médias pour Asexcel, la boîte à outils gratuite pour vos fichiers Excel.",
  path: "/presse",
});

export default function PressePage() {
  return <PressePageClient />;
}
