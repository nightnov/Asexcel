import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { AUTH_DISABLED } from "@/lib/dev-auth";

export const runtime = "nodejs";

/**
 * Creates a Stripe Billing Portal session — Stripe's own hosted page for
 * viewing/removing/adding saved payment methods and cancelling a
 * subscription. Deliberately not reimplemented as custom UI: it's the
 * safest way to let a user manage real card data without this app ever
 * touching it.
 */
export async function POST(request: NextRequest) {
  if (AUTH_DISABLED) {
    return NextResponse.json({ error: "Portail de facturation indisponible en mode développement." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement à gérer pour ce compte." }, { status: 404 });
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/compte`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe billing portal session creation failed:", error);
    return NextResponse.json({ error: "Impossible d'ouvrir le portail de facturation." }, { status: 502 });
  }
}
