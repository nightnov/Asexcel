import FileComparator from "@/components/FileComparator";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Comparateur de 2 versions d'un fichier — Asecxel",
  description:
    "Comparez cellule par cellule deux versions d'un fichier Excel/CSV et exportez un rapport de différences — gratuit, local et sans IA.",
};

export default function FileComparatorPage() {
  return (
    <ToolPageShell>
      <FileComparator />
    </ToolPageShell>
  );
}
