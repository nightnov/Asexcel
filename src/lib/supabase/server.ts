import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Runs under the caller's session (RLS applies) — use this everywhere
 * except the few operations that explicitly require the service role.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase mal configuré : NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant. Vérifiez les variables d'environnement."
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component with no request context to mutate;
          // middleware.ts handles refreshing the session cookie in that case.
        }
      },
    },
  });
}
