/**
 * Local-dev-only escape hatch. When NEXT_PUBLIC_DISABLE_AUTH=true, every
 * Supabase auth/DB/quota call is skipped in favor of a fixed mock user, so
 * the chat/AI flow can be exercised even when Supabase is unreachable
 * (network/CORS/DNS issues, project not fully configured yet, etc.).
 *
 * This must never be enabled outside local development — it disables RLS
 * enforcement entirely by never establishing a real session, and chat
 * history stops being persisted. NEXT_PUBLIC_* so both client and server
 * code can read the same flag without duplicating env plumbing.
 */
export const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";
