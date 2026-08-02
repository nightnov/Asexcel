import SupportPage from "@/components/SupportPage";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Questions, Requêtes & Problèmes — Asecxel",
  description: "Trouvez des réponses rapides à vos questions ou envoyez-nous votre message.",
};

export default function SupportRoutePage() {
  return (
    <ToolPageShell>
      <SupportPage />
    </ToolPageShell>
  );
}
