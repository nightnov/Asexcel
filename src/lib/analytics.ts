/**
 * Google Analytics 4 helper. Entirely inert until NEXT_PUBLIC_GA_MEASUREMENT_ID
 * is set — no placeholder/fake ID is ever used, so a deployment that never
 * configures GA simply never loads gtag.js. Set the real ID in .env.local:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
export const GA_ENABLED = GA_MEASUREMENT_ID.length > 0;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fires a GA4 event — a no-op (safe to call anywhere) when GA isn't configured
 * or gtag hasn't loaded yet. Use for CTA clicks, form submissions, signups. */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!GA_ENABLED) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
