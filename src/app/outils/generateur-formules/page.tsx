import FormulaGenerator from "@/components/FormulaGenerator";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Générateur & Explicateur de Formules — Asecxel",
  description:
    "Décrivez votre besoin en français pour obtenir une formule Excel, ou faites expliquer une formule complexe étape par étape.",
};

export default function FormulaGeneratorPage() {
  return (
    <ToolPageShell>
      <FormulaGenerator />
    </ToolPageShell>
  );
}
