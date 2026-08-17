import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, isRtl } from "@/lib/i18n/config";

// Falls back to the real production domain (not localhost) — NEXT_PUBLIC_SITE_URL
// only needs to be set to override this for a preview/staging deploy.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asexcel.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Homepage title leads with what people actually type into a search box
  // ("outils Excel gratuits", "assistant Excel"), not just the brand name —
  // nobody searches "Asexcel" before they know it exists.
  title: {
    default: "Asexcel : outils Excel gratuits en ligne et assistant IA",
    template: "%s",
  },
  description:
    "Nettoyez, convertissez, fusionnez, divisez et comparez vos fichiers Excel et CSV directement dans votre navigateur. Générateur de formules et assistant IA en français. Gratuit, sans inscription.",
  // favicon.svg is deliberately not listed: it is a 230 KB base64 PNG wrapped
  // in an <svg> tag, not real vector art, so it costs 15x favicon.ico for an
  // identical result and crawlers fetching it first can time out. The .ico is
  // 48x48, which is the size Google's favicon guidelines ask for.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Asexcel",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/logo-transparent.png", width: 556, height: 605, alt: "Asexcel" }],
  },
  twitter: {
    card: "summary",
  },
};

/** Site-wide identity, present on every page. Kept minimal and locale-neutral
 * (name/URL only, no translated marketing copy) so it never drifts out of
 * sync with what's actually rendered — Google requires structured data to
 * match visible page content. */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Asexcel",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-transparent.png`,
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Asexcel",
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        <GoogleAnalytics />
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
