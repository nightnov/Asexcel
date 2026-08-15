import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildEmailChangeCodeEmail } from "@/lib/emailTemplates";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Starts an e-mail change by sending a confirmation code to the NEW address.
 *
 * Deliberately does not use supabase.auth.updateUser({ email }) — that would
 * hand delivery to Supabase's own mailer, the exact thing that fails with
 * 500s on this project (see src/lib/otpDelivery.ts). Instead this mirrors the
 * login/signup flow: admin.generateLink({ type: "email_change_new" }) produces
 * the code without sending anything, and we deliver it through Resend.
 *
 * The address is only actually changed once the client verifies the code with
 * supabase.auth.verifyOtp({ email: newEmail, token, type: "email_change" }) —
 * so an unverified address can never be attached to an account, and the
 * current address stays active until then.
 */
export async function POST(request: NextRequest) {
  let newEmail: unknown;
  try {
    ({ email: newEmail } = await request.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (typeof newEmail !== "string" || !EMAIL_RE.test(newEmail)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  // Session-scoped client: the change always applies to the caller's own
  // account, never an arbitrary id supplied by the request body.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    return NextResponse.json({ error: "Cette adresse est déjà celle de votre compte." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "email_change_new",
    email: user.email,
    newEmail,
  });

  if (error || !data.properties?.email_otp) {
    console.error("generateLink(email_change_new) failed:", error);
    const alreadyUsed = error?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: alreadyUsed ? "Cette adresse e-mail est déjà utilisée." : "Impossible d'envoyer le code. Réessayez plus tard." },
      { status: alreadyUsed ? 409 : 500 }
    );
  }

  const { subject, html, text } = buildEmailChangeCodeEmail(data.properties.email_otp);
  const sent = await sendEmail({ to: newEmail, subject, html, text, category: "otp_code" });

  if (!sent) {
    return NextResponse.json({ error: "Impossible d'envoyer l'e-mail. Réessayez plus tard." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
