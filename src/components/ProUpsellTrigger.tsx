"use client";

import { useEffect, useState } from "react";
import { usePlan } from "@/lib/usePlan";
import ProUpsellModal from "./ProUpsellModal";

const SESSION_FLAG = "asexcel_pro_upsell_shown";
const DELAY_MS = 25_000;

/**
 * Shows the Pro upsell modal once per browser session (sessionStorage-
 * gated) after a delay, to free/guest visitors only — never to Pro users,
 * never more than once per session no matter how many tool pages they
 * visit, and never immediately on page load (that would just feel like an
 * ad blocking the tool before they've even used it).
 */
export default function ProUpsellTrigger() {
  const { plan, loading } = usePlan();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || plan === "pro") return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_FLAG, "1");
      setOpen(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [loading, plan]);

  return <ProUpsellModal open={open} onClose={() => setOpen(false)} />;
}
