import FileProtector from "@/components/FileProtector";
import ToolPageShell from "@/components/ToolPageShell";

export const metadata = {
  title: "Sécurité & Protection — Asecxel",
  description:
    "Compressez votre fichier Excel dans une archive .zip protégée par mot de passe (AES-256) — gratuit, local et sans IA.",
};

export default function FileProtectorPage() {
  return (
    <ToolPageShell>
      <FileProtector />
    </ToolPageShell>
  );
}
