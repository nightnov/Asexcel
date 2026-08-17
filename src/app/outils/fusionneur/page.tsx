import FileMerger from "@/components/FileMerger";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Fusionner plusieurs fichiers Excel en un seul | Asexcel",
  description: "Combinez plusieurs fichiers Excel/CSV en un seul : gratuit, local et sans IA.",
  path: "/outils/fusionneur",
});

export default function FileMergerPage() {
  return (
    <ToolPageShell>
      <FileMerger />
    </ToolPageShell>
  );
}
