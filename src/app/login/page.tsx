import { buildMetadata } from "@/lib/seo";
import LoginPageClient from "@/components/pages/LoginPageClient";

export const metadata = buildMetadata({
  title: "Connexion | Asexcel",
  description: "Connectez-vous à votre compte Asexcel pour accéder à vos outils et à votre historique.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginPageClient />;
}
