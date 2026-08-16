import { buildMetadata } from "@/lib/seo";
import InscriptionPageClient from "@/components/pages/InscriptionPageClient";

export const metadata = buildMetadata({
  title: "Créer un compte — Asexcel",
  description: "Créez gratuitement votre compte Asexcel pour sauvegarder votre historique et débloquer plus de requêtes IA par jour.",
  path: "/inscription",
});

export default function InscriptionPage() {
  return <InscriptionPageClient />;
}
