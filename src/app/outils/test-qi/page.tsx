import type { Metadata } from "next";
import IqTest from "@/components/IqTest";
import ToolPageShell from "@/components/ToolPageShell";

const TITLE = "Test de Q.I. — Asexcel";
const DESCRIPTION =
  "Testez votre raisonnement logique avec un questionnaire ludique de 9 questions : logique, suites numériques, matrices. Score estimé et correction détaillée, gratuit et sans IA.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/outils/test-qi",
    images: [{ url: "/test-qi.png", width: 591, height: 608, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/test-qi.png"],
  },
};

export default function TestQiPage() {
  return (
    <ToolPageShell>
      <IqTest />
    </ToolPageShell>
  );
}
