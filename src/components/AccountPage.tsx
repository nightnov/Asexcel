"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Crown, Check } from "lucide-react";
import LandingHeader from "@/components/LandingHeader";
import { useLocale } from "@/components/LocaleProvider";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/authError";
import { TEBEX_STORE_URL } from "@/lib/tebex";
import type { UserPlan, ProPlanType } from "@/types/database";

interface AccountPageProps {
  userId: string;
  email: string | null;
  name: string | null;
  plan: UserPlan;
  planType: ProPlanType | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function initialsFor(name: string, email: string | null): string {
  const source = name !== "" ? name : email ?? "?";
  return source.trim().charAt(0).toUpperCase();
}

export default function AccountPage({ email, name, plan, planType }: AccountPageProps) {
  const { t } = useLocale();
  const ac = t.account;
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [nameInput, setNameInput] = useState(name ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const PLAN_TYPE_LABEL: Record<ProPlanType, string> = {
    monthly: ac.planTypeMonthly,
    annual: ac.planTypeAnnual,
  };

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    const trimmed = nameInput.trim();
    if (AUTH_DISABLED) {
      setSaveStatus("saved");
      return;
    }
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
      if (error) {
        console.error("Erreur Supabase updateUser :", error);
        setSaveStatus("error");
        setSaveError(getAuthErrorMessage(error, t.auth.unknownError));
        return;
      }
      setSaveStatus("saved");
    } catch (error) {
      console.error("Erreur Supabase updateUser :", error);
      setSaveStatus("error");
      setSaveError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingHeader />

      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-700">
          {ac.backToHome}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1E8E5A] to-[#166B44] text-xl font-semibold text-white">
            {initialsFor(nameInput.trim(), email)}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">{ac.title}</h1>
            {email && <p className="text-sm text-slate-500">{email}</p>}
          </div>
        </div>

        {checkoutSuccess && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {ac.checkoutSuccessBanner}
          </div>
        )}

        {/* Profile section */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.profileSectionTitle}</p>

          <form onSubmit={handleSaveName} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="account-name" className="mb-1.5 block text-xs font-medium text-slate-600">
                {ac.nameLabel}
              </label>
              <input
                id="account-name"
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setSaveStatus("idle");
                }}
                placeholder={ac.namePlaceholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={saveStatus === "saving" || nameInput.trim() === (name ?? "")}
              className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveStatus === "saving" && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {saveStatus === "saving" ? ac.saving : ac.saveCta}
            </button>
          </form>

          {saveStatus === "saved" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" /> {ac.nameSaved}
            </p>
          )}
          {saveStatus === "error" && saveError && <p className="mt-2 text-xs text-red-600">{saveError}</p>}
        </div>

        {/* Plan section */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.planLabel}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {plan === "pro" && <Crown className="h-5 w-5 text-amber-500" strokeWidth={1.75} />}
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
              <a
                href={TEBEX_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                {ac.manageBilling}
              </a>
            </>
          ) : (
            <Link
              href="/checkout"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <Crown className="h-4 w-4" strokeWidth={1.75} />
              {ac.upgradeCta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
