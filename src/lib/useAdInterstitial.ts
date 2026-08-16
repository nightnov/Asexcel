"use client";

import { useCallback, useState } from "react";
import { usePlan } from "@/lib/usePlan";

/**
 * Ad popup shown right when a free/guest user finishes an action (copy,
 * download, export). Never triggers for Pro accounts. Distinct from the
 * ad banners embedded in the page itself: this one shows up at the moment
 * of completing something, matching how the free tier is monetized.
 */
export function useAdInterstitial() {
  const { plan } = usePlan();
  const [open, setOpen] = useState(false);

  const trigger = useCallback(() => {
    if (plan === "pro") return;
    setOpen(true);
  }, [plan]);

  const close = useCallback(() => setOpen(false), []);

  return { open, trigger, close };
}
