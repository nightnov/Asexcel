import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProPlanType } from "@/lib/proPricing";
import { sendEmail } from "@/lib/email";
import { buildProConfirmationEmail } from "@/lib/emailTemplates";

export const runtime = "nodejs";

const PACKAGE_PLAN: Record<string, ProPlanType> = {
  [process.env.NEXT_PUBLIC_TEBEX_PACKAGE_MONTHLY ?? "__unset_monthly__"]: "monthly",
  [process.env.NEXT_PUBLIC_TEBEX_PACKAGE_ANNUAL ?? "__unset_annual__"]: "annual",
};

function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const digest = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  return digest.length === signature.length && crypto.timingSafeEqual(digest, signature);
}

/**
 * Best-effort reconstruction of Tebex's webhook payload shape from their
 * public docs — NOT verified against a real payload yet. Confirm field
 * names (and the signature header/algorithm below) against the actual
 * webhook once it fires from the live Tebex dashboard, and adjust this
 * interface + the parsing below if anything differs.
 */
interface TebexWebhookPayload {
  id: string;
  type: string;
  date?: string;
  subject: {
    id?: string;
    status?: string;
    custom?: string;
    package?: { id?: number | string };
    transaction?: {
      id?: string;
      status?: string;
      custom?: string;
      package?: { id?: number | string };
    };
    [key: string]: unknown;
  };
}

/**
 * Tebex's server-to-server callback — the only place that flips
 * profiles.plan to 'pro'. Uses the service-role client (no user session
 * exists on this request) and verifies a signature so nobody can call this
 * endpoint directly to grant themselves Pro for free.
 *
 * Two things here are assumptions pending confirmation against Tebex's real
 * behavior once the store's webhook is configured:
 *  1. Signature scheme — HMAC-SHA256 of the raw body via an `x-signature`
 *     header, mirroring the Lemon Squeezy integration this replaces. Tebex's
 *     exact header name/algorithm needs verifying in their dashboard docs.
 *  2. The one-off "validation" ping Tebex sends when a webhook URL is first
 *     saved, expecting its id echoed back to confirm endpoint ownership —
 *     implemented as a best guess (`type === "validation.webhook"`).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.TEBEX_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const rawBody = await request.text();

  if (!secret || !signature || !verifySignature(rawBody, signature, secret)) {
    console.error("Tebex webhook: missing or invalid signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: TebexWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (payload.type === "validation.webhook") {
    return NextResponse.json({ id: payload.subject?.id ?? payload.id });
  }

  const admin = createAdminClient();

  try {
    switch (payload.type) {
      // Package purchase completed — grant Pro. Tebex's docs describe the
      // transaction details nested under `subject.transaction` for some
      // event families and flat on `subject` for others; this checks both.
      case "payment.completed": {
        const subject = payload.subject.transaction ?? payload.subject;
        const userId = subject.custom;
        const packageId = String(subject.package?.id ?? "");
        const plan = PACKAGE_PLAN[packageId];
        const transactionId = subject.id;
        if (!userId || !plan || !transactionId) {
          console.warn("Tebex payment.completed: missing userId/plan/transactionId, skipping.", {
            userId,
            packageId,
            transactionId,
          });
          break;
        }

        const { error: updateError } = await admin
          .from("profiles")
          .update({ plan: "pro", plan_type: plan, tebex_transaction_id: transactionId })
          .eq("id", userId);
        // Thrown (not just logged): this write flipping the user to Pro is
        // the whole point of the webhook, so a silent failure must surface
        // as a non-2xx response so Tebex retries it.
        if (updateError) {
          throw new Error(`profiles update failed for user ${userId}: ${updateError.message}`);
        }

        // Best-effort — a failed confirmation e-mail must never fail the
        // webhook itself. The user's plan is already flipped regardless.
        try {
          const { data: userData } = await admin.auth.admin.getUserById(userId);
          const recipient = userData.user?.email;
          if (recipient) {
            const { subject: emailSubject, html, text } = buildProConfirmationEmail(plan);
            await sendEmail({ to: recipient, subject: emailSubject, html, text, category: "pro_confirmation" });
          }
        } catch (emailError) {
          console.warn("Pro confirmation e-mail failed for user", userId, emailError);
        }
        break;
      }

      // Subscription cancelled/expired — revoke access, matched back to the
      // user via the transaction id stored at payment.completed time.
      case "recurring-payment.status.changed": {
        const status = payload.subject.status;
        const transactionId = payload.subject.id;
        if (status !== "cancelled" && status !== "expired") break;
        if (!transactionId) break;

        const { error: updateError } = await admin
          .from("profiles")
          .update({ plan: "free", plan_type: null })
          .eq("tebex_transaction_id", transactionId);
        if (updateError) {
          throw new Error(`profiles downgrade failed for transaction ${transactionId}: ${updateError.message}`);
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Tebex webhook handler failed for event ${payload.type}:`, error);
    return NextResponse.json({ error: "Webhook handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
