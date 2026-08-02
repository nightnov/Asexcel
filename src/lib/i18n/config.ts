export const LOCALES = ["fr", "en", "es", "de", "pt", "it", "nl", "pl", "tr", "ru", "ar", "ja", "zh", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "asexcel_locale";
export const LOCALE_STORAGE_KEY = "asexcel_locale";

const RTL_LOCALES: readonly Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Picks the best supported locale from a raw `Accept-Language` header value
 * (e.g. `"en-US,en;q=0.9,fr;q=0.8"`), falling back to `DEFAULT_LOCALE` when
 * nothing matches. */
export function negotiateLocale(acceptLanguageHeader: string | null): Locale {
  if (!acceptLanguageHeader) return DEFAULT_LOCALE;

  const candidates = acceptLanguageHeader
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const quality = qPart ? parseFloat(qPart) : 1;
      return { tag: tag.toLowerCase(), quality: Number.isNaN(quality) ? 1 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of candidates) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}
