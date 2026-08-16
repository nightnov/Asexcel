import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminConfig";
import { AUTH_DISABLED } from "@/lib/dev-auth";

/**
 * Gate for every /api/admin/* route: only the single hardcoded admin
 * account (see adminConfig.ts) may call these. Returns a 403 response to
 * short-circuit with when unauthorized, or the authenticated user when
 * the caller may proceed.
 */
export async function requireAdmin() {
  if (AUTH_DISABLED) {
    // Local dev bypass: no real session to check, allow through so the
    // admin dashboard is exercisable without a live Supabase project.
    return { authorized: true as const };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Accès refusé." }, { status: 403 }),
    };
  }

  return { authorized: true as const, user };
}
