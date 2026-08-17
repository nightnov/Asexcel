/**
 * Baseline security headers, applied to every route. Deliberately no
 * Content-Security-Policy here: the app loads third-party scripts whose
 * exact hosts vary (AdSense's ad-serving domains rotate, GA4/gtag, Supabase
 * auth redirects, Cloudflare Turnstile), so a CSP written blind would break
 * ads or sign-in in production without being caught locally. Add one only
 * once those hosts are pinned and it can be tested in report-only mode
 * first.
 */
const securityHeaders = [
  // Enforce HTTPS for 2 years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Block the site being framed elsewhere (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Never let the browser guess a response's content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the full URL only to same-origin destinations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app needs none of these device APIs — deny them outright.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hides the framework/version banner from responses.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
