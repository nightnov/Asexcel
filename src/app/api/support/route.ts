import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY_INFO } from "@/lib/companyConfig";
import { sendEmail } from "@/lib/email";
import { buildSupportNotificationEmail, SUPPORT_CATEGORY_LABEL, type SupportCategory } from "@/lib/emailTemplates";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = Object.keys(SUPPORT_CATEGORY_LABEL) as SupportCategory[];

export async function POST(req: NextRequest) {
  let body: { message?: unknown; email?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  const categoryRaw = typeof body.category === "string" ? body.category : "other";

  if (!message) {
    return NextResponse.json({ error: "Le message est requis." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Le message est trop long (4000 caractères max)." }, { status: 400 });
  }
  if (emailRaw && !EMAIL_RE.test(emailRaw)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (!CATEGORIES.includes(categoryRaw as SupportCategory)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const email = emailRaw || null;
  const category = categoryRaw as SupportCategory;

  // Input is fully validated at this point, so any failure past here is an
  // infra/connectivity issue (missing Resend key, Supabase unreachable,
  // etc.), never the user's fault. Same resilience stance as AUTH_DISABLED
  // elsewhere in this app (see src/lib/dev-auth.ts): fall back to a server
  // log rather than surfacing a false negative to the visitor who just
  // wants their message received.
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("support_requests").insert({ message, email });
    if (error) {
      console.warn("support_requests insert failed, logging request instead:", error, { message, email, category });
    }
  } catch (error) {
    console.warn("support_requests insert threw, logging request instead:", error, { message, email, category });
  }

  const { subject, html, text } = buildSupportNotificationEmail({ category, contactEmail: email, message });
  await sendEmail({
    to: COMPANY_INFO.supportInboxEmail,
    replyTo: email ?? undefined,
    category: "support",
    subject,
    html,
    text,
  });

  return NextResponse.json({ ok: true });
}
