import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProPlanType } from "@/lib/proPricing";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const digest = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  return digest.length === signature.length && crypto.timingSafeEqual(digest, signature);
}

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: { supabase_user_id?: string; plan?: ProPlanType };
  };
  data: {
    id: string;
    attributes: {
      status?: string;
      customer_id?: number;
      [key: string]: unknown;
    };
  };
}

/**
 * Lemon Squeezy's server-to-server callback — the only place that actually
 * flips profiles.plan to 'pro'. Uses the service-role client (no user
 * session exists on this request) and verifies the HMAC signature so
 * nobody can call this endpoint directly to grant themselves Pro for free.
 * See https://docs.lemonsqueezy.com/help/webhooks.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const rawBody = await request.text();

  if (!secret || !signature || !verifySignature(rawBody, signature, secret)) {
    console.error("Lemon Squeezy webhook: missing or invalid signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.supabase_user_id;
  const plan = payload.meta?.custom_data?.plan;
  const admin = createAdminClient();

  try {
    switch (eventName) {
      // One-time purchase (our "lifetime" plan) — subscriptions instead fire
      // subscription_created below, so this only ever fires for lifetime.
      case "order_created": {
        if (!userId || plan !== "lifetime" || payload.data.attributes.status !== "paid") break;
        await admin
          .from("profiles")
          .update({
            plan: "pro",
            plan_type: "lifetime",
            lemon_squeezy_customer_id: String(payload.data.attributes.customer_id ?? ""),
          })
          .eq("id", userId);
        break;
      }

      case "subscription_created": {
        if (!userId || !plan) break;
        await admin
          .from("profiles")
          .update({
            plan: "pro",
            plan_type: plan,
            lemon_squeezy_customer_id: String(payload.data.attributes.customer_id ?? ""),
            lemon_squeezy_subscription_id: payload.data.id,
          })
          .eq("id", userId);
        break;
      }

      // A subscription reaching "cancelled" still has access until the paid
      // period ends — Lemon Squeezy sends "expired" once that period is
      // actually over, which is the only point access should be revoked.
      case "subscription_expired": {
        await admin
          .from("profiles")
          .update({ plan: "free", plan_type: null })
          .eq("lemon_squeezy_subscription_id", payload.data.id);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Lemon Squeezy webhook handler failed for event ${eventName}:`, error);
    return NextResponse.json({ error: "Webhook handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
