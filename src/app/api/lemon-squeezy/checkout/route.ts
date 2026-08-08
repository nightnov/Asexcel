import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@/lib/supabase/server";
import { LEMON_SQUEEZY_STORE_ID, variantIdForPlan } from "@/lib/lemonSqueezy";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import type { ProPlanType } from "@/lib/proPricing";

export const runtime = "nodejs";

const VALID_PLANS: ProPlanType[] = ["monthly", "annual"];

/**
 * Creates a Lemon Squeezy hosted Checkout for the requested Pro plan and
 * returns its URL — the client redirects the browser there. Card entry,
 * tax/VAT calculation (Lemon Squeezy is merchant of record), and payment
 * method options all happen on Lemon Squeezy's own page; this route never
 * sees or stores any card data.
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

  if (!LEMON_SQUEEZY_STORE_ID) {
    return NextResponse.json(
      { error: "Le paiement n'est pas encore configuré. Réessayez plus tard." },
      { status: 503 }
    );
  }

  const variantId = variantIdForPlan(plan);
  if (!variantId) {
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
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data, error } = await createCheckout(LEMON_SQUEEZY_STORE_ID, variantId, {
      checkoutData: {
        email: user.email ?? undefined,
        custom: { supabase_user_id: user.id, plan },
      },
      productOptions: {
        redirectUrl: `${origin}/compte?checkout=success`,
      },
      // Themes Lemon Squeezy's own hosted page to match Asexcel's dark UI
      // (the /checkout page below hands off here for the actual secure
      // card/PayPal entry — see its comment for why that step can't be
      // inlined as raw fields in our own code).
      checkoutOptions: {
        backgroundColor: "0B0F0D",
        buttonColor: "1E8E5A",
        primaryTextColor: "FFFFFF",
        secondaryTextColor: "9CA3AF",
      },
    });

    if (error || !data?.data.attributes.url) {
      throw error ?? new Error("No checkout URL returned.");
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (error) {
    console.error("Lemon Squeezy checkout creation failed:", error);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement pour le moment. Réessayez plus tard." },
      { status: 502 }
    );
  }
}
