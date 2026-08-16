import type { Metadata } from "next";

/**
 * Next.js metadata merging is shallow: a page that sets its own `openGraph`
 * object REPLACES the root layout's `openGraph` entirely (including its
 * default image), it does not deep-merge. This helper rebuilds a complete,
 * consistent openGraph/twitter block per page so nothing gets silently
 * dropped — see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging.
 */
const DEFAULT_IMAGE = { url: "/logo-transparent.png", width: 556, height: 605, alt: "Asexcel" };

interface PageMetadataInput {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/outils/nettoyeur". */
  path: string;
  /** Override the default OG image (must exist in /public). */
  image?: { url: string; width: number; height: number; alt: string };
  /** Set true for session-gated or utility pages that should not be indexed. */
  noindex?: boolean;
}

export function buildMetadata({ title, description, path, image, noindex }: PageMetadataInput): Metadata {
  const ogImage = image ?? DEFAULT_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Asexcel",
      type: "website",
      locale: "fr_FR",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}
