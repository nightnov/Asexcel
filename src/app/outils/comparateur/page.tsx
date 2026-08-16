import FileComparator from "@/components/FileComparator";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Comparateur de 2 versions d'un fichier — Asecxel",
  description:
    "Comparez cellule par cellule deux versions d'un fichier Excel/CSV et exportez un rapport de différences — gratuit, local et sans IA.",
  path: "/outils/comparateur",
});

export default function FileComparatorPage() {
  return (
    <ToolPageShell>
      <FileComparator />
    </ToolPageShell>
  );
}
