import FileConverter from "@/components/FileConverter";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Convertisseur Excel → PDF/CSV/JSON — Asecxel",
  description: "Convertissez une feuille Excel/CSV en PDF, CSV ou JSON — gratuit, local et sans IA.",
  path: "/outils/convertisseur",
});

export default function FileConverterPage() {
  return (
    <ToolPageShell>
      <FileConverter />
    </ToolPageShell>
  );
}
