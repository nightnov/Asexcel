"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LandingHeader from "@/components/LandingHeader";
import { useLocale } from "@/components/LocaleProvider";
import type { UserPlan, ProPlanType } from "@/types/database";

interface AccountPageProps {
  userId: string;
  email: string | null;
  plan: UserPlan;
  planType: ProPlanType | null;
}

export default function AccountPage({ email, plan, planType }: AccountPageProps) {
  const { t } = useLocale();
  const ac = t.account;
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const PLAN_TYPE_LABEL: Record<ProPlanType, string> = {
    monthly: ac.planTypeMonthly,
    annual: ac.planTypeAnnual,
  };

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/lemon-squeezy/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? ac.portalError);
      }
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : ac.portalError);
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingHeader />

      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-700">
          {ac.backToHome}
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-ink">{ac.title}</h1>
        {email && <p className="mt-1 text-sm text-slate-500">{email}</p>}

        {checkoutSuccess && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {ac.checkoutSuccessBanner}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.planLabel}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">{plan === "pro" ? ac.planPro : ac.planFree}</span>
            {plan === "pro" && planType && (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                {PLAN_TYPE_LABEL[planType]}
              </span>
            )}
          </div>

          {plan === "pro" ? (
            <>
              <p className="mt-4 text-sm text-slate-500">{ac.manageBillingHint}</p>
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {portalLoading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {ac.manageBilling}
              </button>
              {portalError && <p className="mt-2 text-sm text-red-600">{portalError}</p>}
            </>
          ) : (
            <Link
              href="/checkout"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              {ac.upgradeCta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
