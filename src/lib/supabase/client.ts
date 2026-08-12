"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // A missing/blank var here would otherwise surface as an opaque "Invalid
  // URL" TypeError from deep inside supabase-js's fetch call — this fails
  // immediately with a message that actually says what's wrong.
  if (!url || !anonKey) {
    throw new Error(
      "Supabase mal configuré : NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant. Vérifiez les variables d'environnement."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
