import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/adminConfig";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Dashboard Admin | Asexcel",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!AUTH_DISABLED) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not signed in at all: middleware already redirects to /login for
    // /admin, but a defense-in-depth check here costs nothing. Signed in
    // as anyone other than the one admin account: sent home rather than
    // shown a 403 page, so the route's existence isn't advertised.
    if (!user || !isAdminEmail(user.email)) {
      redirect("/");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F0D] text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
