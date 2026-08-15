import type { ProPlanType } from "@/lib/proPricing";

/**
 * Tebex checkout is entirely hosted on their side — there is no "create
 * checkout session" API call like Lemon Squeezy's; a package purchase is
 * just a link. The Supabase user id is passed through via the `custom`
 * query parameter, which Tebex is expected to echo back on the transaction
 * object in the webhook payload (see src/app/api/tebex/webhook/route.ts).
 * This assumption isn't verified against a real Tebex payload yet — confirm
 * once the store's webhook is live and adjust if the field name differs.
 */
export const TEBEX_STORE_URL = process.env.NEXT_PUBLIC_TEBEX_STORE_URL || "https://asexcel.tebex.store";

// Fall back to the real store's package ids rather than "" — these are
// public identifiers that appear in the checkout URL anyway, not secrets.
// With an empty default, a deployment that simply never had the
// NEXT_PUBLIC_TEBEX_* vars set (they live only in the gitignored
// .env.local) made tebexCheckoutUrl return null, which is what surfaced as
// "Impossible de démarrer le paiement" on every "S'abonner" click.
const PACKAGE_ID: Record<ProPlanType, string> = {
  monthly: process.env.NEXT_PUBLIC_TEBEX_PACKAGE_MONTHLY || "7614332",
  annual: process.env.NEXT_PUBLIC_TEBEX_PACKAGE_ANNUAL || "7614526",
};

/** Builds the Tebex checkout link for a plan, or null if that plan's package id isn't configured. */
export function tebexCheckoutUrl(plan: ProPlanType, userId: string): string | null {
  const packageId = PACKAGE_ID[plan];
  if (!packageId) return null;
  return `${TEBEX_STORE_URL}/package/${packageId}?custom=${encodeURIComponent(userId)}`;
}
