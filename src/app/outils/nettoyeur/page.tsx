import DataCleaner from "@/components/DataCleaner";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Nettoyeur & Formateur de Données — Asecxel",
  description:
    "Nettoyez et reformatez instantanément vos données Excel/CSV : espaces, casse, décimales, doublons — gratuit et sans IA.",
};

export default function DataCleanerPage() {
  return (
    <ToolPageShell>
      <DataCleaner />
    </ToolPageShell>
  );
}
