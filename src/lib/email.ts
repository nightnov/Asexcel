import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY_INFO } from "@/lib/companyConfig";

/**
 * Sender address for every outbound e-mail. Defaults to Resend's shared
 * sandbox sender (only deliverable to the Resend account owner) until a real
 * domain is verified at https://resend.com/domains and EMAIL_FROM is set to
 * something like "Asexcel <contact@asexcel.com>" in production.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || COMPANY_INFO.emailFromAddress;

export type EmailCategory = "support" | "pro_confirmation" | "welcome" | "otp_code";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  category: EmailCategory;
  replyTo?: string;
}

/**
 * Single choke point for every outbound transactional e-mail. Always writes
 * the outcome to `email_logs` (success or failure) so an infra hiccup — bad
 * API key, sandbox-mode rejection, quota — leaves a durable, queryable trace
 * instead of a console.warn nobody is tailing in production. Never throws:
 * callers should treat this as best-effort and keep going regardless of the
 * return value (an e-mail failing to send must never break the underlying
 * action — DB update, checkout, login — that triggered it).
 */
export async function sendEmail({ to, subject, html, text, category, replyTo }: SendEmailInput): Promise<boolean> {
  let status: "sent" | "failed" = "sent";
  let errorMessage: string | null = null;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to, replyTo, subject, html, text });
    if (error) {
      status = "failed";
      errorMessage = error.message ?? String(error);
    }
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  try {
    const admin = createAdminClient();
    const { error: logError } = await admin
      .from("email_logs")
      .insert({ category, recipient: to, subject, status, error: errorMessage });
    if (logError) {
      console.warn("email_logs insert failed:", logError, { category, to, status, errorMessage });
    }
  } catch (logErr) {
    console.warn("email_logs insert threw:", logErr, { category, to, status, errorMessage });
  }

  if (status === "failed") {
    console.warn(`sendEmail(${category}) to ${to} failed:`, errorMessage);
  }

  return status === "sent";
}
