import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY_INFO } from "@/lib/companyConfig";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEGORIES = ["question", "request", "problem", "other"] as const;
type Category = (typeof CATEGORIES)[number];
const CATEGORY_LABEL: Record<Category, string> = {
  question: "Question",
  request: "Requête",
  problem: "Problème",
  other: "Autre",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  if (!CATEGORIES.includes(categoryRaw as Category)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const email = emailRaw || null;
  const category = categoryRaw as Category;

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

  await sendEmail({
    to: COMPANY_INFO.supportInboxEmail,
    replyTo: email ?? undefined,
    category: "support",
    subject: `[Support Asexcel] ${CATEGORY_LABEL[category]}`,
    html: `
      <div style="font-family: sans-serif; font-size: 14px; color: #111;">
        <p><strong>Catégorie :</strong> ${escapeHtml(CATEGORY_LABEL[category])}</p>
        <p><strong>E-mail de contact :</strong> ${email ? escapeHtml(email) : "non renseigné"}</p>
        <p><strong>Message :</strong></p>
        <p style="white-space: pre-wrap; border-left: 3px solid #34D399; padding-left: 12px;">${escapeHtml(message)}</p>
      </div>
    `,
    text: `Catégorie : ${CATEGORY_LABEL[category]}\nE-mail de contact : ${email ?? "non renseigné"}\n\nMessage :\n${message}`,
  });

  return NextResponse.json({ ok: true });
}
