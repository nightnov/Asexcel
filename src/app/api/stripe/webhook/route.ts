import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProPlanType } from "@/lib/stripeConfig";

export const runtime = "nodejs";

/**
 * Stripe's server-to-server callback — the only place that actually flips
 * profiles.plan to 'pro'. Uses the service-role client (no user session
 * exists on this request) and verifies the signature so nobody can call
 * this endpoint directly to grant themselves Pro for free.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!signature || !webhookSecret) {
    console.error("Stripe webhook: missing signature or STRIPE_WEBHOOK_SECRET.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan as ProPlanType | undefined;
        if (!userId || !plan) break;

        await admin
          .from("profiles")
          .update({
            plan: "pro",
            plan_type: plan,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
          })
          .eq("id", userId);
        break;
      }

      // A subscription (monthly/annual) lapsing — payment failure exhausted retries, or Stripe
      // marked it unpaid/incomplete_expired. Lifetime purchases have no subscription, so this
      // never fires for them; they stay Pro forever once paid, by design.
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        await admin.from("profiles").update({ plan: "free", plan_type: null }).eq("id", userId);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
