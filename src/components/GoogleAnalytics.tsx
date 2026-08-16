import Script from "next/script";
import { GA_ENABLED, GA_MEASUREMENT_ID } from "@/lib/analytics";

/** Renders nothing at all unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set — see
 * src/lib/analytics.ts. Loads gtag.js and wires automatic pageview tracking;
 * src/lib/analytics.ts#trackEvent() covers everything else (CTA clicks,
 * form submits, signups). */
export default function GoogleAnalytics() {
  if (!GA_ENABLED) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
