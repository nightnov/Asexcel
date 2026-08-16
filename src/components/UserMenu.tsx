"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { MessageSquare, Wrench, Settings, Sparkles, LogOut, ChevronDown } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";
import UserAvatar from "@/components/UserAvatar";

function avatarUrlFor(user: User): string | null {
  return (user.user_metadata?.avatar_url as string | undefined) ?? null;
}

function displayNameFor(user: User, unknownLabel: string): string {
  const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined);
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const emailPrefix = user.email?.split("@")[0]?.trim();
  return emailPrefix || unknownLabel;
}

export default function UserMenu({ user }: { user: User }) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    if (AUTH_DISABLED) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/chat", label: t.userMenu.assistant, icon: MessageSquare },
    { href: "/outils", label: t.userMenu.tools, icon: Wrench },
    { href: "/compte", label: t.nav.monCompte, icon: Settings },
  ];

  const avatarUrl = avatarUrlFor(user);
  const name = displayNameFor(user, t.userMenu.unknownName);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/5"
      >
        <UserAvatar avatarUrl={avatarUrl} size={32} className="ring-2 ring-white/10" />
        <ChevronDown className={`h-3.5 w-3.5 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_56px_-16px_rgba(15,23,42,0.3)]"
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <UserAvatar avatarUrl={avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 py-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <link.icon className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.75} />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-100 p-2">
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#1E8E5A]/10 to-[#1E8E5A]/5 px-3 py-2.5 text-sm font-semibold text-[#166B44] transition hover:from-[#1E8E5A]/15 hover:to-[#1E8E5A]/10"
            >
              <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {t.account.upgradeCta}
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <LogOut className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.75} />
              {t.nav.seDeconnecter}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
