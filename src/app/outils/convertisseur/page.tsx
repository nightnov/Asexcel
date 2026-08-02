import FileConverter from "@/components/FileConverter";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Convertisseur Excel → PDF/CSV/JSON — Asecxel",
  description: "Convertissez une feuille Excel/CSV en PDF, CSV ou JSON — gratuit, local et sans IA.",
};

export default function FileConverterPage() {
  return (
    <ToolPageShell>
      <FileConverter />
    </ToolPageShell>
  );
}
