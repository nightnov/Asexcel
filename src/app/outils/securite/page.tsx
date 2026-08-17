import FileProtector from "@/components/FileProtector";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Protéger un fichier Excel par mot de passe | Asexcel",
  description:
    "Compressez votre fichier Excel dans une archive .zip protégée par mot de passe (AES-256) — gratuit, local et sans IA.",
  path: "/outils/securite",
});

export default function FileProtectorPage() {
  return (
    <ToolPageShell>
      <FileProtector />
    </ToolPageShell>
  );
}
