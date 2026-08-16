import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

/** "2026-08" style month key, used to bucket signups for the growth chart. */
function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function lastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.authorized) return gate.response;

  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: proUsers },
    { count: totalConversations },
    { count: totalMessages },
    { count: pendingSupport },
    { data: signupDates },
    { data: recentUsers },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("role", "assistant"),
    admin.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("profiles").select("created_at").order("created_at", { ascending: true }),
    admin
      .from("profiles")
      .select("id, email, plan, plan_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const months = lastNMonthKeys(6);
  const signupsByMonth = new Map(months.map((m) => [m, 0]));
  for (const row of signupDates ?? []) {
    const key = monthKey(row.created_at);
    if (signupsByMonth.has(key)) {
      signupsByMonth.set(key, (signupsByMonth.get(key) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    proUsers: proUsers ?? 0,
    totalConversations: totalConversations ?? 0,
    totalMessages: totalMessages ?? 0,
    pendingSupport: pendingSupport ?? 0,
    growth: months.map((m) => ({ month: m, signups: signupsByMonth.get(m) ?? 0 })),
    recentUsers: recentUsers ?? [],
  });
}
