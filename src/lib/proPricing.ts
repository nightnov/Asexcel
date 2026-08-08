/**
 * Pro pricing — shared between the client (display) and server (checkout
 * creation). Provider-neutral: these dollar amounts are for display only
 * and must be kept in sync with whatever the Lemon Squeezy variant is
 * actually configured to charge (see src/lib/lemonSqueezy.ts for the
 * variant ID lookup).
 */
export type ProPlanType = "monthly" | "annual" | "lifetime";

export const PRO_PRICING: Record<ProPlanType, { amountUsd: number }> = {
  monthly: { amountUsd: 9.99 },
  annual: { amountUsd: 79.99 },
  lifetime: { amountUsd: 99.99 },
};

/**
 * Annual price expressed as an effective monthly rate, for the "$6.66/mo" line.
 * $79.99 / 12 = $6.6658..., displayed floored (not rounded) to $6.66 to match
 * the advertised rate exactly.
 */
export const ANNUAL_MONTHLY_EQUIVALENT = Math.floor((PRO_PRICING.annual.amountUsd / 12) * 100) / 100;

/** % saved by paying annually vs. 12x the monthly price, rounded for display ("Save 33%"). */
export const ANNUAL_SAVINGS_PERCENT = Math.round(
  (1 - PRO_PRICING.annual.amountUsd / (PRO_PRICING.monthly.amountUsd * 12)) * 100
);
