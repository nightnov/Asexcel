/**
 * FAQPage JSON-LD built from the exact same `items` the visible FaqAccordion
 * renders (same prop, same data) — Google requires structured data to match
 * what a user actually sees on the page, so this never hardcodes its own copy.
 */
export default function FaqStructuredData({ items }: { items: { q: string; a: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
