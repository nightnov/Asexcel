"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED, MOCK_USER_ID } from "@/lib/dev-auth";

const MOCK_USER = { id: MOCK_USER_ID, email: "dev@localhost" } as User;

/**
 * Client-side auth state, reactive to sign-in/sign-out without a full page
 * reload — needed by anything rendered on server-agnostic pages (like
 * LandingHeader, mounted on both public and authenticated routes) that must
 * reflect the session instantly instead of waiting for the next navigation.
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(AUTH_DISABLED ? MOCK_USER : null);
  const [loading, setLoading] = useState(!AUTH_DISABLED);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
