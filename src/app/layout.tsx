import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, isRtl } from "@/lib/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Asexcel — Assistant Excel",
    template: "%s",
  },
  description:
    "Assistant IA et outils automatisés pour vos formules, macros et fichiers Excel/CSV.",
  icons: {
    icon: "/logo-transparent.png",
    shortcut: "/logo-transparent.png",
    apple: "/logo-transparent.png",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
