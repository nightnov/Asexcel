"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Crown, Check, User, Shield, Link2 } from "lucide-react";
import LandingHeader from "@/components/LandingHeader";
import { useLocale } from "@/components/LocaleProvider";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, logSupabaseError } from "@/lib/authError";
import { TEBEX_STORE_URL } from "@/lib/tebex";
import { GoogleIcon, FacebookIcon, AppleIcon, MicrosoftIcon } from "@/components/icons/AuthIcons";
import type { UserPlan, ProPlanType } from "@/types/database";

interface AccountPageProps {
  userId: string;
  email: string | null;
  name: string | null;
  plan: UserPlan;
  planType: ProPlanType | null;
  linkedProviders: string[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
type Tab = "profile" | "security" | "subscription";

const OAUTH_PROVIDERS = [
  { id: "google", icon: GoogleIcon, label: "Google" },
  { id: "facebook", icon: FacebookIcon, label: "Facebook" },
  { id: "apple", icon: AppleIcon, label: "Apple" },
  { id: "azure", icon: MicrosoftIcon, label: "Microsoft" },
] as const;

const MIN_PASSWORD_LENGTH = 8;

function initialsFor(name: string, email: string | null): string {
  const source = name !== "" ? name : email ?? "?";
  return source.trim().charAt(0).toUpperCase();
}

export default function AccountPage({ email, name, plan, planType, linkedProviders }: AccountPageProps) {
  const { t } = useLocale();
  const ac = t.account;
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [tab, setTab] = useState<Tab>("profile");

  const [nameInput, setNameInput] = useState(name ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [linkLoading, setLinkLoading] = useState<string | null>(null);

  const PLAN_TYPE_LABEL: Record<ProPlanType, string> = {
    monthly: ac.planTypeMonthly,
    annual: ac.planTypeAnnual,
  };

  const TABS: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: ac.profileSectionTitle, icon: User },
    { id: "security", label: ac.sidebarSecurity, icon: Shield },
    { id: "subscription", label: ac.sidebarSubscription, icon: Crown },
  ];

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
        logSupabaseError("Erreur Supabase updateUser :", error);
        setSaveStatus("error");
        setSaveError(getAuthErrorMessage(error, t.auth.unknownError));
        return;
      }
      setSaveStatus("saved");
    } catch (error) {
      logSupabaseError("Erreur Supabase updateUser :", error);
      setSaveStatus("error");
      setSaveError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordStatus("error");
      setPasswordError(t.auth.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordError(ac.passwordMismatch);
      return;
    }

    if (AUTH_DISABLED) {
      setPasswordStatus("saved");
      return;
    }

    setPasswordStatus("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        logSupabaseError("Erreur Supabase updateUser (password) :", error);
        setPasswordStatus("error");
        setPasswordError(getAuthErrorMessage(error, t.auth.unknownError));
        return;
      }
      setPasswordStatus("saved");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      logSupabaseError("Erreur Supabase updateUser (password) :", error);
      setPasswordStatus("error");
      setPasswordError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  async function handleLinkProvider(provider: "google" | "facebook" | "apple" | "azure") {
    if (AUTH_DISABLED) return;
    setLinkLoading(provider);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: `${window.location.origin}/compte` },
      });
      if (error) {
        logSupabaseError("Erreur Supabase linkIdentity :", error);
        setLinkLoading(null);
      }
    } catch (error) {
      logSupabaseError("Erreur Supabase linkIdentity :", error);
      setLinkLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingHeader />

      <div className="mx-auto max-w-5xl px-4 py-10">
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

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  tab === item.id ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {tab === "profile" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  {saveStatus === "error" && <div className="mt-2 text-xs text-red-600">{saveError || "Erreur inconnue"}</div>}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.auth.emailLabel}</p>
                    <p className="mt-1.5 text-sm text-slate-700">{email}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.linkedAccountsTitle}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{ac.linkedAccountsHint}</p>

                  <ul className="mt-4 divide-y divide-slate-100">
                    {OAUTH_PROVIDERS.map((provider) => {
                      const connected = linkedProviders.includes(provider.id);
                      return (
                        <li key={provider.id} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-3">
                            <provider.icon />
                            <span className="text-sm font-medium text-slate-700">{provider.label}</span>
                          </div>
                          {connected ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                              <Check className="h-3.5 w-3.5" /> {ac.connectedLabel}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLinkProvider(provider.id)}
                              disabled={linkLoading !== null}
                              className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {linkLoading === provider.id ? t.auth.connecting : ac.connectLabel}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            {tab === "security" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.sidebarSecurity}</p>

                <form onSubmit={handleChangePassword} className="mt-3 max-w-sm space-y-3">
                  <div>
                    <label htmlFor="account-new-password" className="mb-1.5 block text-xs font-medium text-slate-600">
                      {ac.newPasswordLabel}
                    </label>
                    <input
                      id="account-new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordStatus("idle");
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="account-confirm-password" className="mb-1.5 block text-xs font-medium text-slate-600">
                      {ac.confirmPasswordLabel}
                    </label>
                    <input
                      id="account-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordStatus("idle");
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {passwordStatus === "error" && <div className="text-xs text-red-600">{passwordError || "Erreur inconnue"}</div>}
                  {passwordStatus === "saved" && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> {ac.passwordUpdated}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={passwordStatus === "saving" || !newPassword || !confirmPassword}
                    className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {passwordStatus === "saving" && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {passwordStatus === "saving" ? ac.saving : ac.changePasswordCta}
                  </button>
                </form>
              </div>
            )}

            {tab === "subscription" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
