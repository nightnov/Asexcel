import FormulaTranslator from "@/components/FormulaTranslator";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Traduire les formules Excel français anglais | Asexcel",
  description:
    "Convertissez instantanément vos formules Excel entre le français et l'anglais, gratuitement et sans IA.",
  path: "/outils/formules",
});

export default function FormulaTranslatorPage() {
  return (
    <ToolPageShell>
      <FormulaTranslator />
    </ToolPageShell>
  );
}
