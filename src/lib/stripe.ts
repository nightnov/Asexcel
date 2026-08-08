import "server-only";
import Stripe from "stripe";
import type { ProPlanType } from "@/lib/stripeConfig";
import { PRO_PRICING } from "@/lib/stripeConfig";

/**
 * Single Stripe server client. STRIPE_SECRET_KEY is a placeholder until a
 * real Stripe account is connected — every call below will fail cleanly
 * with a Stripe API error until it's replaced (see .env.example).
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-07-29.dahlia",
});

/** Resolves the configured Stripe Price ID for a plan, from its env var — see stripeConfig.ts. */
export function priceIdForPlan(plan: ProPlanType): string | undefined {
  return process.env[PRO_PRICING[plan].envVar];
}
