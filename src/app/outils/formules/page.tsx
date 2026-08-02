import FormulaTranslator from "@/components/FormulaTranslator";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Traducteur de formules Excel FR ↔ EN — Asecxel",
  description:
    "Convertissez instantanément vos formules Excel entre le français et l'anglais, gratuitement et sans IA.",
};

export default function FormulaTranslatorPage() {
  return (
    <ToolPageShell>
      <FormulaTranslator />
    </ToolPageShell>
  );
}
