import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOtpCode } from "@/lib/otpDelivery";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Password sign-up, split from Supabase's own signUp() for the same reason
 * /api/auth/send-code exists (see src/lib/otpDelivery.ts): signUp() would
 * trigger Supabase's own "Confirm signup" e-mail through its own mailer,
 * which is the exact thing already found to fail with 500s on this project.
 *
 * Instead: create the account server-side via the admin API with
 * email_confirm: false (createUser() never sends an e-mail itself), then
 * deliver our own confirmation code through the same Resend-based OTP
 * pipeline already used for passwordless login. The client verifies it with
 * the normal supabase.auth.verifyOtp({ type: "email" }) — which both
 * confirms the e-mail and signs the user in — so a brand-new account ends
 * up with a real password AND a confirmed, active session, without ever
 * touching Supabase's own mailer.
 */
export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { email, password } = body;
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: false });

  if (createError) {
    console.error("admin.createUser failed:", createError);
    const alreadyExists = createError.message?.toLowerCase().includes("already been registered");
    return NextResponse.json(
      { error: alreadyExists ? "Un compte existe déjà avec cette adresse e-mail." : "Impossible de créer le compte. Réessayez plus tard." },
      { status: alreadyExists ? 409 : 500 }
    );
  }

  const result = await sendOtpCode(admin, email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
