"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePlan } from "@/lib/usePlan";

export type AdSlotName = "sidebar" | "tool-result";

const SLOT_SPECS: Record<AdSlotName, { minHeight: string; maxWidth: string }> = {
  sidebar: { minHeight: "250px", maxWidth: "300px" },
  "tool-result": { minHeight: "90px", maxWidth: "728px" },
};

interface AdBannerProps {
  slot: AdSlotName;
  className?: string;
}

/**
 * Ad-network-ready monetization slot. Ships wired for Google AdSense
 * (the data-ad-* attributes below); swapping to Ezoic or another network
 * only means replacing the <ins> markup inside the "configured" branch —
 * the plan-gating and placeholder behavior stay the same.
 *
 * Hidden entirely (renders nothing, no reserved space) for Pro subscribers
 * and while the plan is still loading — never flashes an ad at a Pro user
 * who just hasn't resolved yet. Shows a labeled placeholder for guest/free
 * accounts until real NEXT_PUBLIC_ADSENSE_* credentials are set.
 */
export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  const { plan, loading } = usePlan();
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
  const slotId =
    slot === "sidebar"
      ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? ""
      : process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_RESULT ?? "";
  const isConfigured = Boolean(clientId && slotId);
  const spec = SLOT_SPECS[slot];
  const showAd = !loading && plan !== "pro";

  useEffect(() => {
    if (!showAd || !isConfigured) return;
    try {
      // adsbygoogle is injected globally by the AdSense loader script below.
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle ??= [];
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
    } catch {
      // Loader script not ready yet (slow network) — AdSense retries on its own.
    }
  }, [showAd, isConfigured]);

  if (!showAd) return null;

  return (
    <div
      className={`w-full ${className}`}
      style={{ maxWidth: spec.maxWidth }}
      role="complementary"
      aria-label="Publicité"
    >
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">Publicité</span>
      {isConfigured ? (
        <>
          <Script
            id="adsbygoogle-loader"
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
            crossOrigin="anonymous"
          />
          <ins
            className="adsbygoogle block w-full"
            style={{ minHeight: spec.minHeight }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </>
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400"
          style={{ minHeight: spec.minHeight }}
        >
          Emplacement publicitaire
        </div>
      )}
    </div>
  );
}
