import type { ProPlanType } from "@/lib/proPricing";

/**
 * Tebex checkout is entirely hosted on their side — there is no "create
 * checkout session" API call like Lemon Squeezy's; a package purchase is
 * just a link. The Supabase user id is passed through via the `custom`
 * query parameter, which Tebex is expected to echo back on the transaction
 * object in the webhook payload (see src/app/api/tebex/webhook/route.ts).
 *
 * To get real Tebex links:
 * 1. Go to https://creator.tebex.io/dashboard
 * 2. Select your store (asexcel.tebex.store)
 * 3. Go to Packages → copy the package ID from the URL
 * 4. Set NEXT_PUBLIC_TEBEX_PACKAGE_MONTHLY and NEXT_PUBLIC_TEBEX_PACKAGE_ANNUAL in .env.local
 */
export const TEBEX_STORE_URL = process.env.NEXT_PUBLIC_TEBEX_STORE_URL || "https://asexcel.tebex.store";

// Package IDs from Tebex dashboard. These are public IDs visible in checkout URLs.
// Update these with real values from your Tebex creator dashboard:
// Monthly: https://creator.tebex.io/dashboard → Packages → find monthly plan → copy ID
// Annual: https://creator.tebex.io/dashboard → Packages → find annual plan → copy ID
const PACKAGE_ID: Record<ProPlanType, string> = {
  monthly: process.env.NEXT_PUBLIC_TEBEX_PACKAGE_MONTHLY || "7614332",
  annual: process.env.NEXT_PUBLIC_TEBEX_PACKAGE_ANNUAL || "7614526",
};

/**
 * Builds the Tebex checkout link for a plan.
 * Returns null if package ID is not configured, allowing UI to show a fallback.
 *
 * To verify links work:
 * 1. Copy the returned URL and open in browser
 * 2. You should see the Tebex checkout page for that plan
 * 3. If you get 404 or "not found", the package ID is wrong
 */
export function tebexCheckoutUrl(plan: ProPlanType, userId: string): string | null {
  const packageId = PACKAGE_ID[plan];
  if (!packageId) {
    console.warn(`Tebex package ID not configured for ${plan} plan`);
    return null;
  }
  return `${TEBEX_STORE_URL}/package/${packageId}?custom=${encodeURIComponent(userId)}`;
}
