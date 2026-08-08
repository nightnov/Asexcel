import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildWelcomeEmail } from "@/lib/emailTemplates";

// Exchanges the magic-link code for a session and sets the auth cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    // Best-effort, exactly-once welcome e-mail. Gated on profiles.welcome_email_sent_at
    // (set by the DB trigger's row, updated here) rather than user.created_at, so a
    // slow/failed send on a first login can still be retried on the next one instead
    // of being silently skipped forever. Never blocks or fails the redirect below.
    if (user?.email) {
      try {
        const admin = createAdminClient();
        const { data: profile } = await admin
          .from("profiles")
          .select("welcome_email_sent_at")
          .eq("id", user.id)
          .single();

        if (profile && !profile.welcome_email_sent_at) {
          const { subject, html, text } = buildWelcomeEmail();
          const sent = await sendEmail({ to: user.email, subject, html, text, category: "welcome" });
          if (sent) {
            await admin.from("profiles").update({ welcome_email_sent_at: new Date().toISOString() }).eq("id", user.id);
          }
        }
      } catch (error) {
        console.warn("Welcome e-mail flow failed for user", user.id, error);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
