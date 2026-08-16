import { buildMetadata } from "@/lib/seo";
import BlogPageClient from "@/components/pages/BlogPageClient";

export const metadata = buildMetadata({
  title: "Blog — Asexcel",
  description: "Conseils, astuces et actualités autour d'Excel, des formules et de l'automatisation de fichiers avec Asexcel.",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogPageClient />;
}
