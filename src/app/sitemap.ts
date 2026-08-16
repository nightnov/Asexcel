import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asexcel.com";

/** Static routes only — /compte, /checkout and /admin require a session (or
 * are private), and are already excluded via robots.ts, so they have no
 * place in a sitemap either. */
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/chat", priority: 0.9, changeFrequency: "monthly" },
  { path: "/tarifs", priority: 0.8, changeFrequency: "monthly" },
  { path: "/outils", priority: 0.8, changeFrequency: "monthly" },
  { path: "/outils/nettoyeur", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/formules", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/generateur-formules", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/comparateur", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/convertisseur", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/securite", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/fusionneur", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/diviseur", priority: 0.7, changeFrequency: "monthly" },
  { path: "/outils/test-qi", priority: 0.6, changeFrequency: "monthly" },
  { path: "/outils/support", priority: 0.6, changeFrequency: "monthly" },
  { path: "/login", priority: 0.4, changeFrequency: "yearly" },
  { path: "/inscription", priority: 0.4, changeFrequency: "yearly" },
  { path: "/a-propos", priority: 0.5, changeFrequency: "yearly" },
  { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/presse", priority: 0.4, changeFrequency: "yearly" },
  { path: "/securite", priority: 0.3, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" },
  { path: "/conditions", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
