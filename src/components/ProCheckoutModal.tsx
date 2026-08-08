"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PRO_PRICING, ANNUAL_MONTHLY_EQUIVALENT, ANNUAL_SAVINGS_PERCENT, type ProPlanType } from "@/lib/proPricing";

interface ProCheckoutModalProps {
  onClose: () => void;
}

const PLAN_ORDER: ProPlanType[] = ["monthly", "annual", "lifetime"];

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function ProCheckoutModal({ onClose }: ProCheckoutModalProps) {
  const { t } = useLocale();
  const pp = t.pro;
  const [loadingPlan, setLoadingPlan] = useState<ProPlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const PLAN_COPY: Record<ProPlanType, { label: string; price: string; subLabel: string | null; badge: string | null }> = {
    monthly: { label: pp.monthlyLabel, price: `${formatUsd(PRO_PRICING.monthly.amountUsd)} ${pp.perMonthSuffix}`, subLabel: null, badge: null },
    annual: {
      label: pp.annualLabel,
      price: `${formatUsd(PRO_PRICING.annual.amountUsd)} ${pp.perYearSuffix}`,
      subLabel: pp.annualSubLabel.replace("{amount}", formatUsd(ANNUAL_MONTHLY_EQUIVALENT)),
      badge: pp.annualBadge.replace("{percent}", String(ANNUAL_SAVINGS_PERCENT)),
    },
    lifetime: { label: pp.lifetimeLabel, price: formatUsd(PRO_PRICING.lifetime.amountUsd), subLabel: pp.lifetimeSubLabel, badge: null },
  };

  async function handleSelect(plan: ProPlanType) {
    setLoadingPlan(plan);
    setError(null);
    try {
      const res = await fetch("/api/lemon-squeezy/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? pp.genericError);
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : pp.genericError);
      setLoadingPlan(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-checkout-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="pro-checkout-title" className="text-lg font-semibold text-slate-900">
              {pp.modalTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{pp.modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={pp.closeLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-2.5">
          {PLAN_ORDER.map((plan) => {
            const copy = PLAN_COPY[plan];
            return (
              <button
                key={plan}
                type="button"
                onClick={() => handleSelect(plan)}
                disabled={loadingPlan !== null}
                className={`relative flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  plan === "annual"
                    ? "border-brand-400 bg-brand-50"
                    : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{copy.label}</span>
                    {copy.badge && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {copy.badge}
                      </span>
                    )}
                  </div>
                  {copy.subLabel && <p className="mt-0.5 text-xs text-slate-500">{copy.subLabel}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{copy.price}</span>
                  {loadingPlan === plan && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-slate-400">{pp.taxNote}</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <p className="mt-5 text-[11px] leading-relaxed text-slate-400">{pp.legalTextRecurring}</p>
      </div>
    </div>
  );
}
