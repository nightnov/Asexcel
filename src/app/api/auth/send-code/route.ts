import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildOtpCodeEmail } from "@/lib/emailTemplates";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Custom OTP delivery, bypassing supabase.auth.signInWithOtp() entirely.
 *
 * signInWithOtp() both generates the code AND sends the e-mail through
 * Supabase's own configured mailer in one request — when that mailer is
 * broken or misconfigured (bad/no custom SMTP, hit the built-in mailer's
 * rate limit), the whole call fails with a 500 AuthRetryableFetchError and
 * no code is ever generated, let alone delivered.
 *
 * admin.generateLink({ type: "magiclink" }) is the Supabase-documented way
 * to decouple the two: it creates the user if needed and returns the same
 * 6-digit code (`properties.email_otp`) Supabase would have e-mailed, but
 * never attempts to send anything itself — delivery is entirely our
 * responsibility, so it can't fail on a broken mailer. We send it via the
 * Resend pipeline already used for every other transactional e-mail in
 * this app (src/lib/email.ts), which is independently known to work.
 *
 * Verification is unaffected and still goes through the normal client-side
 * supabase.auth.verifyOtp({ email, token, type: "email" }) — Supabase
 * verifies this exactly like a code it had e-mailed itself.
 */
export async function POST(request: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });

  if (error || !data.properties?.email_otp) {
    console.error("generateLink failed for OTP send:", error);
    return NextResponse.json({ error: "Impossible de générer le code de connexion. Réessayez plus tard." }, { status: 500 });
  }

  const { subject, html, text } = buildOtpCodeEmail(data.properties.email_otp);
  const sent = await sendEmail({ to: email, subject, html, text, category: "otp_code" });

  if (!sent) {
    return NextResponse.json({ error: "Impossible d'envoyer l'e-mail. Réessayez plus tard." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
