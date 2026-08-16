import { buildMetadata } from "@/lib/seo";
import ConditionsPageClient from "@/components/pages/ConditionsPageClient";

export const metadata = buildMetadata({
  title: "Conditions générales — Asexcel",
  description: "Conditions générales d'utilisation des outils et services Asexcel.",
  path: "/conditions",
});

export default function ConditionsPage() {
  return <ConditionsPageClient />;
}
