/**
 * Pro pricing — shared between the client (display) and server (webhook
 * confirmation e-mails). Provider-neutral: these dollar amounts are for
 * display only and must be kept in sync with whatever the Tebex packages
 * are actually configured to charge (see src/lib/tebex.ts for the package
 * ID lookup — package 7614332 = monthly, 7614526 = annual). Only recurring
 * plans — no one-time "lifetime" tier.
 */
export type ProPlanType = "monthly" | "annual";

export const PRO_PRICING: Record<ProPlanType, { amountUsd: number }> = {
  monthly: { amountUsd: 9.99 },
  annual: { amountUsd: 99.99 },
};

/**
 * Annual price expressed as an effective monthly rate, for the "$X.XX/mo" line.
 * Floored (not rounded) so the displayed rate never overstates the discount.
 */
export const ANNUAL_MONTHLY_EQUIVALENT = Math.floor((PRO_PRICING.annual.amountUsd / 12) * 100) / 100;

/** % saved by paying annually vs. 12x the monthly price, rounded for display ("Save 17%"). */
export const ANNUAL_SAVINGS_PERCENT = Math.round(
  (1 - PRO_PRICING.annual.amountUsd / (PRO_PRICING.monthly.amountUsd * 12)) * 100
);
