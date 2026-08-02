import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserPlan } from "@/types/database";
import { MEMBER_DAILY_LIMIT } from "@/lib/quotaConfig";

export { MEMBER_DAILY_LIMIT };

/**
 * Returns today's date in the server's UTC day, matching `quota_reset_at`
 * (a plain `date` column) so comparisons don't need timezone handling.
 */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  plan: UserPlan;
}

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  plan: UserPlan;
}

interface LoadedProfile {
  used: number;
  plan: UserPlan;
}

async function loadProfile(supabase: SupabaseClient<Database>, userId: string): Promise<LoadedProfile> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("daily_quota_used, quota_reset_at, plan")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Impossible de charger le profil utilisateur pour vérifier le quota.");
  }

  const isNewDay = profile.quota_reset_at !== todayUtc();
  return { used: isNewDay ? 0 : profile.daily_quota_used, plan: profile.plan };
}

/**
 * Read-only quota check — for displaying "X/Y questions restantes" in the
 * UI before the user has submitted anything. Never writes, so it's safe to
 * call on every page load without affecting the count.
 */
export async function getDailyQuotaStatus(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QuotaStatus> {
  const { used, plan } = await loadProfile(supabase, userId);
  if (plan === "pro") {
    return { used: 0, limit: 0, remaining: 0, unlimited: true, plan };
  }
  return {
    used,
    limit: MEMBER_DAILY_LIMIT,
    remaining: Math.max(0, MEMBER_DAILY_LIMIT - used),
    unlimited: false,
    plan,
  };
}

/**
 * Reads the caller's profile, resets the counter if we've rolled into a new
 * day, and — if a question is still available — atomically increments it.
 * Pro accounts are unlimited and never touch the counter at all. Uses the
 * request-scoped Supabase client so RLS ("own row only") applies; no
 * service role needed since a user is always allowed to update their own
 * quota counter.
 */
export async function consumeDailyQuota(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QuotaCheckResult> {
  const { used, plan } = await loadProfile(supabase, userId);

  if (plan === "pro") {
    return { allowed: true, used: 0, limit: 0, remaining: 0, unlimited: true, plan };
  }

  const today = todayUtc();

  if (used >= MEMBER_DAILY_LIMIT) {
    return { allowed: false, used, limit: MEMBER_DAILY_LIMIT, remaining: 0, unlimited: false, plan };
  }

  const nextUsed = used + 1;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ daily_quota_used: nextUsed, quota_reset_at: today })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Impossible de mettre à jour le quota utilisateur.");
  }

  return {
    allowed: true,
    used: nextUsed,
    limit: MEMBER_DAILY_LIMIT,
    remaining: MEMBER_DAILY_LIMIT - nextUsed,
    unlimited: false,
    plan,
  };
}
