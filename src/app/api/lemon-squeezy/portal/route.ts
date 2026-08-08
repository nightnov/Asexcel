import { NextResponse } from "next/server";
import { getSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@/lib/supabase/server";
import { AUTH_DISABLED } from "@/lib/dev-auth";

export const runtime = "nodejs";

/**
 * Returns the visitor's Lemon Squeezy Customer Portal URL — Lemon Squeezy's
 * own hosted page for viewing/updating a saved payment method, downloading
 * invoices, and cancelling a subscription. Deliberately not reimplemented
 * as custom UI: it's the safest way to let a user manage real card data
 * without this app ever touching it. Only applies to monthly/annual plans
 * (lifetime purchases have no subscription to manage).
 */
export async function POST() {
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
      .select("lemon_squeezy_subscription_id")
      .eq("id", user.id)
      .single();

    if (!profile?.lemon_squeezy_subscription_id) {
      return NextResponse.json({ error: "Aucun abonnement à gérer pour ce compte." }, { status: 404 });
    }

    const { data, error } = await getSubscription(profile.lemon_squeezy_subscription_id);
    const portalUrl = data?.data.attributes.urls.customer_portal;
    if (error || !portalUrl) {
      throw error ?? new Error("No customer portal URL returned.");
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Lemon Squeezy portal lookup failed:", error);
    return NextResponse.json({ error: "Impossible d'ouvrir le portail de facturation." }, { status: 502 });
  }
}
