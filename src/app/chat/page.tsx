import { buildMetadata } from "@/lib/seo";
import ChatWindow from "@/components/ChatWindow";

export const metadata = buildMetadata({
  title: "Assistant Excel IA — Asexcel",
  description: "Posez vos questions sur Excel : formules, macros VBA, tableaux croisés dynamiques. Réponses instantanées, en français.",
  path: "/chat",
});

export default function ChatPage() {
  return <ChatWindow />;
}
