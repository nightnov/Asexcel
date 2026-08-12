"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useLocale } from "@/components/LocaleProvider";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";
import { ChatSparkleIcon, FolderIcon, SparklesIcon } from "@/components/icons/ToolIcons";

function GearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function initialsFor(user: User): string {
  const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined);
  const source = name ?? user.email ?? "?";
  return source.trim().charAt(0).toUpperCase();
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
    { href: "/chat", label: t.userMenu.assistant, icon: <ChatSparkleIcon className="h-4 w-4" /> },
    { href: "/outils", label: t.userMenu.tools, icon: <FolderIcon className="h-4 w-4" /> },
    { href: "/compte", label: t.nav.monCompte, icon: <GearIcon className="h-4 w-4" /> },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E8E5A] text-sm font-semibold text-white transition hover:brightness-110"
      >
        {initialsFor(user)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.25)]"
        >
          <div className="px-4 py-3.5">
            <p className="truncate text-sm font-semibold text-gray-900">{displayNameFor(user, t.userMenu.unknownName)}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="border-t border-gray-100 py-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-100 p-2">
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl bg-[#E4F5EC] px-3 py-2 text-sm font-semibold text-[#166B44] transition hover:bg-[#d5efe2]"
            >
              <SparklesIcon className="h-4 w-4" />
              {t.account.upgradeCta}
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <LogoutIcon className="h-4 w-4" />
              {t.nav.seDeconnecter}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
