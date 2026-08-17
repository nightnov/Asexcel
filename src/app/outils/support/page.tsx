import SupportPage from "@/components/SupportPage";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Aide et support | Asexcel",
  description: "Trouvez des réponses rapides à vos questions ou envoyez-nous votre message.",
  path: "/outils/support",
});

export default function SupportRoutePage() {
  return (
    <ToolPageShell>
      <SupportPage />
    </ToolPageShell>
  );
}
