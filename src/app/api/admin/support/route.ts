import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.authorized) return gate.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_requests")
    .select("id, message, email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Admin support list failed:", error);
    return NextResponse.json({ error: "Impossible de charger les demandes." }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.authorized) return gate.response;

  let body: { id?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const STATUSES = ["new", "read", "resolved"] as const;
  const id = typeof body.id === "string" ? body.id : null;
  const status = STATUSES.find((s) => s === body.status) ?? null;
  if (!id || !status) {
    return NextResponse.json({ error: "id et status (new|read|resolved) sont requis." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("support_requests").update({ status }).eq("id", id);

  if (error) {
    console.error("Admin support status update failed:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour la demande." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
