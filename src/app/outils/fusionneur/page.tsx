import FileMerger from "@/components/FileMerger";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Fusion de fichiers — Asecxel",
  description: "Combinez plusieurs fichiers Excel/CSV en un seul — gratuit, local et sans IA.",
};

export default function FileMergerPage() {
  return (
    <ToolPageShell>
      <FileMerger />
    </ToolPageShell>
  );
}
