import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.authorized) return gate.response;

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = admin
    .from("profiles")
    .select("id, email, plan, plan_type, daily_quota_used, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Admin users list failed:", error);
    return NextResponse.json({ error: "Impossible de charger les utilisateurs." }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}

/** Manually grants or revokes Pro for a user. The only other place plan
 * changes happen is the Tebex webhook — this is the admin override for
 * support cases (refunds, goodwill access, testing). */
export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.authorized) return gate.response;

  let body: { userId?: unknown; plan?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : null;
  const plan = body.plan === "pro" ? "pro" : body.plan === "free" ? "free" : null;
  if (!userId || !plan) {
    return NextResponse.json({ error: "userId et plan (pro|free) sont requis." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ plan, plan_type: plan === "pro" ? "monthly" : null })
    .eq("id", userId);

  if (error) {
    console.error("Admin plan update failed:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le plan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
