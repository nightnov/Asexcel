"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { PRO_PRICING, ANNUAL_MONTHLY_EQUIVALENT, ANNUAL_SAVINGS_PERCENT, type ProPlanType } from "@/lib/proPricing";

interface CheckoutPageProps {
  email: string | null;
}

type PayMethod = "card" | "paypal";

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-[#34D399]">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
      <path d="M6.5 10.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckoutPage({ email }: CheckoutPageProps) {
  const { t } = useLocale();
  const pp = t.pro;
  const co = t.checkout;
  const tarifs = t.pages.tarifs;
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") === "annual" ? "annual" : "monthly";

  const [plan, setPlan] = useState<ProPlanType>(initialPlan);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [renewalAck, setRenewalAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = formatUsd(PRO_PRICING[plan].amountUsd);

  async function handleSubscribe() {
    setLoading(true);
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
      setLoading(false);
    }
  }

  const features = [tarifs.proFeature1, tarifs.proFeature2, tarifs.proFeature3];

  return (
    <div className="min-h-screen bg-[#0B0F0D] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E8E5A]">
            <img src="/logo-transparent.png" alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="font-serif text-lg font-bold text-white">Asexcel</span>
        </Link>
        <Link href="/tarifs" className="text-xs font-medium text-white/50 transition hover:text-white">
          {co.backToPricing}
        </Link>
      </div>

      <div className="mx-auto grid max-w-5xl gap-12 px-6 pb-24 pt-6 lg:grid-cols-2 lg:gap-16">
        {/* Left column — payment method */}
        <div>
          <h1 className="text-xl font-medium text-white">{co.configureTitle}</h1>
          {email && <p className="mt-1 text-xs text-white/40">{email}</p>}

          <p className="mt-8 text-sm font-medium text-white/60">{co.payWithTitle}</p>

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {co.expressPayLabel}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/35">{co.orDivider}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-1 text-sm">
            <button
              type="button"
              onClick={() => setPayMethod("card")}
              className={`rounded-md px-4 py-1.5 font-medium transition ${
                payMethod === "card" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {co.cardTab}
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("paypal")}
              className={`rounded-md px-4 py-1.5 font-medium transition ${
                payMethod === "paypal" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {co.paypalTab}
            </button>
          </div>

          {payMethod === "card" ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">{co.cardNumberLabel}</label>
                <div className="flex h-11 items-center rounded-lg border border-white/10 bg-white/[0.02] px-3.5">
                  <span className="text-sm text-white/25">{co.cardNumberPlaceholder}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/40">{co.expiryLabel}</label>
                  <div className="flex h-11 items-center rounded-lg border border-white/10 bg-white/[0.02] px-3.5">
                    <span className="text-sm text-white/25">{co.expiryPlaceholder}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/40">{co.cvvLabel}</label>
                  <div className="flex h-11 items-center rounded-lg border border-white/10 bg-white/[0.02] px-3.5">
                    <span className="text-sm text-white/25">{co.cvvPlaceholder}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-white/35">{co.secureFieldsNotice}</p>
          )}

          <p className="mt-6 text-xs leading-relaxed text-white/35">{co.savePaymentLabel}</p>

          <p className="mt-3 text-xs leading-relaxed text-white/30">
            {co.legalConsentText.split("{terms}")[0]}
            <Link href="/conditions" className="underline hover:text-white/60">
              {co.termsLinkLabel}
            </Link>
            {co.legalConsentText.split("{terms}")[1].split("{privacy}")[0]}
            <Link href="/confidentialite" className="underline hover:text-white/60">
              {co.privacyLinkLabel}
            </Link>
            {co.legalConsentText.split("{privacy}")[1]}
          </p>
        </div>

        {/* Right column — plan summary card */}
        <div className="rounded-2xl bg-[#17181A] p-7">
          <h2 className="text-lg font-medium text-white">{co.planDetailsTitle}</h2>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`rounded-xl border px-3.5 py-2.5 text-left transition ${
                plan === "monthly" ? "border-white/25 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
              }`}
            >
              <div className="text-sm font-semibold text-white">{pp.monthlyLabel}</div>
              <div className="text-xs text-white/45">
                {formatUsd(PRO_PRICING.monthly.amountUsd)} {pp.perMonthSuffix}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPlan("annual")}
              className={`relative rounded-xl border px-3.5 py-2.5 text-left transition ${
                plan === "annual" ? "border-white/25 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
              }`}
            >
              <span className="absolute -top-2 right-2 rounded-full bg-[#1E8E5A] px-2 py-0.5 text-[10px] font-semibold text-white">
                {pp.annualBadge.replace("{percent}", String(ANNUAL_SAVINGS_PERCENT))}
              </span>
              <div className="text-sm font-semibold text-white">{pp.annualLabel}</div>
              <div className="text-xs text-white/45">
                {pp.annualSubLabel.replace("{amount}", formatUsd(ANNUAL_MONTHLY_EQUIVALENT))}
              </div>
            </button>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-white/35">{co.featuresSubtitle}</p>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/75">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6 h-px w-full bg-white/10" />

          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between text-white/55">
              <span>{plan === "monthly" ? co.monthlySubscriptionLine : co.annualSubscriptionLine}</span>
              <span>{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-white/55">
              <span>{co.taxLabel}</span>
              <span>$0.00</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-semibold text-white">
              <span>{co.totalTodayLabel}</span>
              <span>{subtotal}</span>
            </div>
          </div>

          <label className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-white/40">
            <input
              type="checkbox"
              checked={renewalAck}
              onChange={(e) => setRenewalAck(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-white"
            />
            {co.autoRenewalCheckboxLabel}
          </label>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={!renewalAck || loading}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />}
            {loading ? co.redirecting : co.subscribeCta}
          </button>
        </div>
      </div>
    </div>
  );
}
