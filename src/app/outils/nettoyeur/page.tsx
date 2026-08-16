import DataCleaner from "@/components/DataCleaner";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Nettoyeur & Formateur de Données — Asecxel",
  description:
    "Nettoyez et reformatez instantanément vos données Excel/CSV : espaces, casse, décimales, doublons — gratuit et sans IA.",
  path: "/outils/nettoyeur",
});

export default function DataCleanerPage() {
  return (
    <ToolPageShell>
      <DataCleaner />
    </ToolPageShell>
  );
}
