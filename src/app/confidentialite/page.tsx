import { buildMetadata } from "@/lib/seo";
import ConfidentialitePageClient from "@/components/pages/ConfidentialitePageClient";

export const metadata = buildMetadata({
  title: "Politique de confidentialité — Asexcel",
  description: "Comment Asexcel collecte, utilise et protège vos données personnelles et vos fichiers Excel/CSV.",
  path: "/confidentialite",
});

export default function ConfidentialitePage() {
  return <ConfidentialitePageClient />;
}
