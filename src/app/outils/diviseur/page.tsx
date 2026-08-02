import FileSplitter from "@/components/FileSplitter";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Division de fichiers — Asecxel",
  description:
    "Découpez un gros fichier Excel/CSV en plusieurs parties, par feuille ou par lot de lignes — gratuit, local et sans IA.",
};

export default function FileSplitterPage() {
  return (
    <ToolPageShell>
      <FileSplitter />
    </ToolPageShell>
  );
}
