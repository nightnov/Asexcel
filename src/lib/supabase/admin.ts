import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client that bypasses Row Level Security.
 * Only for trusted server-side operations (quota bookkeeping, signed URL
 * generation across a user's own files, admin.generateLink for OTP codes).
 * Never import this from a Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Accepts either key format as-is, no special-casing needed: the legacy
 * JWT-shaped service_role key, or Supabase's newer `sb_secret_...` secret
 * key — supabase-js treats both as an opaque bearer token/apikey header
 * value and never parses/validates its shape client-side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase mal configuré : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY est manquant. Vérifiez les variables d'environnement."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
