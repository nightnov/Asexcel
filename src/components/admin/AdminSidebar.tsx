"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Headphones, ArrowLeft } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, exact: false },
  { href: "/admin/support", label: "Support", icon: Headphones, exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#0B0F0D] px-3 py-5">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E8E5A]">
          <img src="/logo-transparent.png" alt="" className="h-5 w-5 object-contain" />
        </span>
        <span className="font-serif text-base font-bold text-white">Asexcel Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-[#1E8E5A]/15 text-[#34D399]" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
        Retour au site
      </Link>
    </aside>
  );
}
