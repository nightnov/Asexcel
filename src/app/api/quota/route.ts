import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDailyQuotaStatus, MEMBER_DAILY_LIMIT } from "@/lib/quota";
import { AUTH_DISABLED } from "@/lib/dev-auth";

export const runtime = "nodejs";

/**
 * Read-only quota lookup so the UI can show "X/Y questions restantes"
 * before the user submits anything. In AUTH_DISABLED dev mode there's no
 * Supabase session to read, so the client falls back to a localStorage
 * counter instead of calling this route. A 401 here (real auth mode, no
 * session) is the expected signal for an anonymous guest — the client
 * treats it as "fall back to the local guest counter", not an error (see
 * src/lib/useDailyQuota.ts).
 */
export async function GET() {
  if (AUTH_DISABLED) {
    return NextResponse.json({
      used: 0,
      limit: MEMBER_DAILY_LIMIT,
      remaining: MEMBER_DAILY_LIMIT,
      unlimited: false,
      plan: "free",
    });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const status = await getDailyQuotaStatus(supabase, user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Quota status lookup failed:", error);
    return NextResponse.json({ error: "Impossible de récupérer le quota." }, { status: 500 });
  }
}
