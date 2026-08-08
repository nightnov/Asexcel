"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_DISABLED } from "@/lib/dev-auth";

export type PlanTier = "guest" | "free" | "pro";

/**
 * Lightweight plan-tier lookup shared by anything that needs to know "which
 * plan is this visitor on" without the AI-credit bookkeeping that
 * useDailyQuota carries (used by the non-AI utility tools to size-gate
 * uploads). Same detection logic as useDailyQuota: AUTH_DISABLED simulates
 * a free member; otherwise GET /api/quota — 401 means no session (guest),
 * 200 carries the real plan from the Supabase profile.
 */
export function usePlan(): { plan: PlanTier; loading: boolean } {
  const [plan, setPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (AUTH_DISABLED) {
      setPlan("free");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/quota");
      if (res.status === 401) {
        setPlan("guest");
      } else if (res.ok) {
        const data = await res.json();
        setPlan(data.plan === "pro" ? "pro" : "free");
      }
    } catch {
      // Network hiccup — keep the last known plan rather than wrongly
      // downgrading the visitor's upload limit.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plan, loading };
}
