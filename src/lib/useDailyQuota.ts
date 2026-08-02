"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { GUEST_DAILY_LIMIT, MEMBER_DAILY_LIMIT } from "@/lib/quotaConfig";

export { GUEST_DAILY_LIMIT };
const DEV_MOCK_LIMIT = MEMBER_DAILY_LIMIT;
const LOCAL_STORAGE_PREFIX = "asecxel_quota_";

function todayKey(scope: string): string {
  return `${LOCAL_STORAGE_PREFIX}${scope}_${new Date().toISOString().slice(0, 10)}`;
}

function readLocalUsed(scope: string): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(todayKey(scope)) ?? 0);
}

function writeLocalUsed(scope: string, used: number) {
  window.localStorage.setItem(todayKey(scope), String(used));
}

export type QuotaPlan = "guest" | "free" | "pro";

export interface DailyQuota {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  /** "guest" = no account (this browser's localStorage counter), "free"/"pro" = real Supabase-tracked account. */
  plan: QuotaPlan;
  loading: boolean;
  exhausted: boolean;
  /** True when this count lives in localStorage (dev bypass or guest) rather than being server-verified. */
  isLocal: boolean;
  /** Bumps the local counter after a generation — only meaningful when `isLocal` is true. */
  recordLocalUse: () => void;
  /** Syncs from a server response's `quotaRemaining` (null = cache hit, quota untouched). Only meaningful for server-tracked accounts. */
  setRemaining: (remaining: number | null) => void;
  refresh: () => Promise<void>;
  /** Dev-only: clears today's local counter so AUTH_DISABLED testing isn't blocked by a stale quota. No-op for real guest/member accounts. */
  resetLocal: () => void;
}

/**
 * Three tiers, three sources of truth:
 *  - AUTH_DISABLED (local dev bypass): no Supabase session to read at all,
 *    so it simulates a free member via a localStorage counter.
 *  - Guest (real auth mode, no session): allowed to use the AI tools with a
 *    smaller daily allowance, tracked purely client-side in localStorage.
 *    This is trivially bypassable (clear storage / private window) — an
 *    accepted trade-off since the goal is nudging sign-up, not airtight
 *    abuse prevention. Signalled by GET /api/quota returning 401.
 *  - Member/Pro (real auth mode, session present): server-tracked in
 *    Supabase via GET /api/quota (source of truth, also enforced by the
 *    API routes) — free members get MEMBER_DAILY_LIMIT/day, Pro is
 *    unlimited.
 */
export function useDailyQuota(): DailyQuota {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(DEV_MOCK_LIMIT);
  const [unlimited, setUnlimited] = useState(false);
  const [plan, setPlan] = useState<QuotaPlan>("free");
  const [loading, setLoading] = useState(true);
  // null = server-tracked (member/pro); "dev" or "guest" = which localStorage bucket to read/write.
  const [localScope, setLocalScope] = useState<"dev" | "guest" | null>(null);

  const refresh = useCallback(async () => {
    if (AUTH_DISABLED) {
      setPlan("free");
      setLimit(DEV_MOCK_LIMIT);
      setUnlimited(false);
      setLocalScope("dev");
      setUsed(readLocalUsed("dev"));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/quota");
      if (res.status === 401) {
        setPlan("guest");
        setLimit(GUEST_DAILY_LIMIT);
        setUnlimited(false);
        setLocalScope("guest");
        setUsed(readLocalUsed("guest"));
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan === "pro" ? "pro" : "free");
        setUnlimited(Boolean(data.unlimited));
        setLimit(typeof data.limit === "number" ? data.limit : DEV_MOCK_LIMIT);
        setUsed(typeof data.used === "number" ? data.used : 0);
        setLocalScope(null);
      }
    } catch {
      // Network hiccup — leave the last known count in place rather than
      // wrongly showing "0 remaining" and blocking the user.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function recordLocalUse() {
    if (!localScope) return; // server-tracked account — nothing to bump locally
    const next = readLocalUsed(localScope) + 1;
    writeLocalUsed(localScope, next);
    setUsed(next);
  }

  function setRemaining(remaining: number | null) {
    if (remaining === null) return; // cache hit — quota untouched
    if (localScope) return; // only a server response applies here
    setUsed(Math.max(0, limit - remaining));
  }

  function resetLocal() {
    if (!localScope) return;
    writeLocalUsed(localScope, 0);
    setUsed(0);
  }

  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    unlimited,
    plan,
    loading,
    exhausted: !loading && !unlimited && remaining <= 0,
    isLocal: localScope !== null,
    recordLocalUse,
    setRemaining,
    refresh,
    resetLocal,
  };
}
