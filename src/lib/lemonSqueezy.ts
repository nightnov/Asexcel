import "server-only";
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import type { ProPlanType } from "@/lib/proPricing";

/**
 * Configures the Lemon Squeezy SDK once per server process. LEMON_SQUEEZY_API_KEY
 * is a placeholder until a real (verified) Lemon Squeezy account is connected —
 * every API call will fail cleanly with an auth error until it's replaced
 * (see .env.example).
 */
lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY ?? "" });

export const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID ?? "";

const VARIANT_ENV_VAR: Record<ProPlanType, string> = {
  monthly: "LEMON_SQUEEZY_VARIANT_MONTHLY",
  annual: "LEMON_SQUEEZY_VARIANT_ANNUAL",
};

/** Resolves the configured Lemon Squeezy variant ID for a plan, from its env var. */
export function variantIdForPlan(plan: ProPlanType): string | undefined {
  return process.env[VARIANT_ENV_VAR[plan]];
}
