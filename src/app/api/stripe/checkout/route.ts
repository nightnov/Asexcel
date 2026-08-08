import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, priceIdForPlan } from "@/lib/stripe";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import type { ProPlanType } from "@/lib/stripeConfig";

export const runtime = "nodejs";

const VALID_PLANS: ProPlanType[] = ["monthly", "annual", "lifetime"];

/**
 * Creates a Stripe Checkout Session for the requested Pro plan and returns
 * its hosted URL — the client redirects the browser there. Card entry, tax
 * calculation (Stripe Tax), and wallet options (PayPal/Google Pay, enabled
 * per-account in the Stripe Dashboard) all happen on Stripe's own page; this
 * route never sees or stores any card data.
 */
export async function POST(request: NextRequest) {
  if (AUTH_DISABLED) {
    return NextResponse.json(
      { error: "Le paiement Pro nécessite un compte réel (désactivez NEXT_PUBLIC_DISABLE_AUTH pour tester)." },
      { status: 400 }
    );
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const plan = body.plan as ProPlanType;
  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Ce plan n'est pas encore configuré côté paiement. Réessayez plus tard." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour souscrire au plan Pro." }, { status: 401 });
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const isSubscription = plan !== "lifetime";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      payment_intent_data: isSubscription ? undefined : { setup_future_usage: "off_session" },
      success_url: `${origin}/compte?checkout=success`,
      cancel_url: `${origin}/tarifs?checkout=cancelled`,
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: isSubscription ? { metadata: { supabase_user_id: user.id, plan } } : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement pour le moment. Réessayez plus tard." },
      { status: 502 }
    );
  }
}
