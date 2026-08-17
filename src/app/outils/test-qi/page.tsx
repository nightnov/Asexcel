import IqTest from "@/components/IqTest";
import ToolPageShell from "@/components/ToolPageShell";
import { buildMetadata } from "@/lib/seo";

const TITLE = "Test de Q.I. | Asexcel";
const DESCRIPTION =
  "Testez votre raisonnement logique avec un questionnaire ludique de 9 questions : logique, suites numériques, matrices. Score estimé et correction détaillée, gratuit et sans IA.";

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/outils/test-qi",
  image: { url: "/test-qi.png", width: 591, height: 608, alt: TITLE },
});

export default function TestQiPage() {
  return (
    <ToolPageShell>
      <IqTest />
    </ToolPageShell>
  );
}
