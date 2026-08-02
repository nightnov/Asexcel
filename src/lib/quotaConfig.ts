/**
 * Shared quota numbers — imported by both the server (src/lib/quota.ts,
 * "server-only") and client components (QuotaModal's copy needs to know
 * both tiers' limits to render "upgrade from X to Y" messaging). Kept in
 * its own plain module so client code never has to import "server-only".
 */
export const MEMBER_DAILY_LIMIT = Number(process.env.NEXT_PUBLIC_DAILY_FREE_QUESTIONS ?? 15);
/** Anonymous visitors (no account) — enforced client-side only, see src/lib/useDailyQuota.ts. */
export const GUEST_DAILY_LIMIT = 5;
