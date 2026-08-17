import FormulaGenerator from "@/components/FormulaGenerator";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Générateur de formules Excel gratuit | Asexcel",
  description:
    "Décrivez votre besoin en français pour obtenir une formule Excel, ou faites expliquer une formule complexe étape par étape.",
  path: "/outils/generateur-formules",
});

export default function FormulaGeneratorPage() {
  return (
    <ToolPageShell>
      <FormulaGenerator />
    </ToolPageShell>
  );
}
