/**
 * Whether Cloudflare Turnstile anti-abuse is actually configured.
 *
 * Client and server must agree on this: the browser only holds a token back
 * when the widget can really produce one, and the API only demands a token
 * when it can really verify one. Without that agreement the app deadlocks —
 * with no site key the invisible widget renders nothing, so `onVerify` never
 * fires, so the token stays null, so every AI request is refused forever with
 * "Vérification anti-abus en cours" and no way out.
 *
 * NEXT_PUBLIC_* is inlined at build time, so this must reference the variable
 * literally (not via a computed key) for the bundler to substitute it.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** True only when a site key is present — otherwise the feature is simply off. */
export const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;
