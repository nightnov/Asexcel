import { buildMetadata } from "@/lib/seo";
import SecuritePageClient from "@/components/pages/SecuritePageClient";

export const metadata = buildMetadata({
  title: "Sécurité — Asexcel",
  description: "Comment Asexcel protège vos fichiers : traitement local, chiffrement des mots de passe, authentification et signalement de failles.",
  path: "/securite",
});

export default function SecuritePage() {
  return <SecuritePageClient />;
}
