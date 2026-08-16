"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Crown, Check, User, Shield, Receipt, BarChart3, MessageSquare, Sparkles, CalendarDays, Camera } from "lucide-react";
import LandingHeader from "@/components/LandingHeader";
import OtpCodeInput from "@/components/OtpCodeInput";
import UserAvatar from "@/components/UserAvatar";
import { useLocale } from "@/components/LocaleProvider";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, logSupabaseError } from "@/lib/authError";
import { TEBEX_STORE_URL } from "@/lib/tebex";
import { poppins, inter } from "@/lib/fonts";
import styles from "@/app/landing.module.css";
import type { UserPlan, ProPlanType } from "@/types/database";

interface AccountPageProps {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  plan: UserPlan;
  planType: ProPlanType | null;
  transactionId: string | null;
  memberSince: string | null;
  conversationCount: number;
  aiReplyCount: number;
  aiUsedToday: number;
  aiDailyLimit: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
type EmailStep = "idle" | "editing" | "code" | "done";
type Tab = "profile" | "security" | "subscription";

const MIN_PASSWORD_LENGTH = 8;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

function StatTile({ icon: Icon, label, value }: { icon: typeof MessageSquare; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function AccountPage({
  userId,
  email,
  name,
  avatarUrl,
  plan,
  planType,
  transactionId,
  memberSince,
  conversationCount,
  aiReplyCount,
  aiUsedToday,
  aiDailyLimit,
}: AccountPageProps) {
  const { t, locale } = useLocale();
  const ac = t.account;
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [tab, setTab] = useState<Tab>("profile");

  const [nameInput, setNameInput] = useState(name ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentEmail, setCurrentEmail] = useState(email ?? "");
  const [emailStep, setEmailStep] = useState<EmailStep>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailStatus, setEmailStatus] = useState<SaveStatus>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isPro = plan === "pro";

  const PLAN_TYPE_LABEL: Record<ProPlanType, string> = {
    monthly: ac.planTypeMonthly,
    annual: ac.planTypeAnnual,
  };

  const TABS: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: ac.profileSectionTitle, icon: User },
    { id: "security", label: ac.sidebarSecurity, icon: Shield },
    { id: "subscription", label: ac.sidebarSubscription, icon: Crown },
  ];

  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString(locale, { year: "numeric", month: "long" })
    : "";

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarError(null);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError(ac.avatarInvalidType);
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(ac.avatarTooLarge);
      return;
    }

    if (AUTH_DISABLED) {
      setCurrentAvatarUrl(URL.createObjectURL(file));
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        logSupabaseError("Erreur Supabase storage upload avatar :", uploadError);
        setAvatarError(ac.avatarUploadFailed);
        return;
      }

      // Cache-bust so the browser picks up the new image at the same path
      // immediately instead of serving the previous upload from cache.
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const bustedUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: bustedUrl } });
      if (updateError) {
        logSupabaseError("Erreur Supabase updateUser (avatar_url) :", updateError);
        setAvatarError(ac.avatarUploadFailed);
        return;
      }

      setCurrentAvatarUrl(bustedUrl);
      router.refresh();
    } catch (error) {
      logSupabaseError("Erreur Supabase upload avatar :", error);
      setAvatarError(ac.avatarUploadFailed);
    } finally {
      setAvatarUploading(false);
    }
  }

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

  async function handleSendEmailCode(event: FormEvent) {
    event.preventDefault();
    setEmailError(null);
    if (AUTH_DISABLED) {
      setEmailStep("code");
      return;
    }
    setEmailStatus("saving");
    try {
      // Goes through our own route rather than updateUser({ email }) — see
      // src/app/api/auth/change-email/route.ts for why.
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        logSupabaseError("Erreur changement e-mail :", body);
        setEmailStatus("error");
        setEmailError(body.error || t.auth.unknownError);
        return;
      }
      setEmailStatus("idle");
      setEmailStep("code");
    } catch (error) {
      logSupabaseError("Erreur changement e-mail :", error);
      setEmailStatus("error");
      setEmailError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  async function handleVerifyEmailCode(event: FormEvent) {
    event.preventDefault();
    setEmailError(null);
    if (AUTH_DISABLED) {
      setCurrentEmail(newEmail);
      setEmailStep("done");
      return;
    }
    setEmailStatus("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email: newEmail, token: emailCode, type: "email_change" });
      if (error) {
        logSupabaseError("Erreur Supabase verifyOtp (email_change) :", error);
        setEmailStatus("error");
        setEmailError(t.auth.invalidCode);
        return;
      }
      setEmailStatus("idle");
      setCurrentEmail(newEmail);
      setEmailStep("done");
      router.refresh();
    } catch (error) {
      logSupabaseError("Erreur Supabase verifyOtp (email_change) :", error);
      setEmailStatus("error");
      setEmailError(getAuthErrorMessage(error, t.auth.unknownError));
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

  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable} min-h-screen`}>
      <LandingHeader />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-700">
          {ac.backToHome}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <div className="group relative">
            <UserAvatar avatarUrl={currentAvatarUrl} size={56} />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label={ac.changePhotoCta}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100 disabled:cursor-wait"
            >
              <Camera className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">{ac.title}</h1>
            {currentEmail && <p className="text-sm text-slate-500">{currentEmail}</p>}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="mt-0.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {avatarUploading ? ac.saving : ac.changePhotoCta}
            </button>
            {avatarError && <p className="mt-0.5 text-xs text-red-600">{avatarError}</p>}
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

                {/* E-mail — editable, verified with a code sent to the new address */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.auth.emailLabel}</p>
                    {emailStep === "idle" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailStep("editing");
                          setNewEmail("");
                          setEmailError(null);
                        }}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        {ac.editCta}
                      </button>
                    )}
                  </div>

                  {emailStep === "idle" && <p className="mt-1.5 text-sm text-slate-700">{currentEmail}</p>}

                  {emailStep === "done" && (
                    <>
                      <p className="mt-1.5 text-sm text-slate-700">{currentEmail}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> {ac.emailUpdated}
                      </p>
                    </>
                  )}

                  {emailStep === "editing" && (
                    <form onSubmit={handleSendEmailCode} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label htmlFor="account-new-email" className="mb-1.5 block text-xs font-medium text-slate-600">
                          {ac.newEmailLabel}
                        </label>
                        <input
                          id="account-new-email"
                          type="email"
                          required
                          autoFocus
                          placeholder={t.auth.emailPlaceholder}
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={emailStatus === "saving" || !newEmail}
                          className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {emailStatus === "saving" && (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          )}
                          {emailStatus === "saving" ? t.auth.sendingLink : ac.sendCodeCta}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailStep("idle");
                            setEmailError(null);
                          }}
                          className="h-[42px] rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                        >
                          {ac.cancelCta}
                        </button>
                      </div>
                    </form>
                  )}

                  {emailStep === "code" && (
                    <form onSubmit={handleVerifyEmailCode} className="mt-3 max-w-sm space-y-3">
                      <p className="text-sm leading-relaxed text-slate-600">
                        {t.auth.linkSentPrefix} <strong>{newEmail}</strong>
                        {t.auth.linkSentSuffix}
                      </p>
                      <OtpCodeInput value={emailCode} onChange={setEmailCode} disabled={emailStatus === "saving"} autoFocus />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={emailStatus === "saving" || emailCode.length !== 6}
                          className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {emailStatus === "saving" && (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          )}
                          {emailStatus === "saving" ? t.auth.verifyingCode : t.auth.verifyCta}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailStep("idle");
                            setEmailCode("");
                            setEmailError(null);
                          }}
                          className="h-[42px] rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                        >
                          {ac.cancelCta}
                        </button>
                      </div>
                    </form>
                  )}

                  {emailStatus === "error" && <div className="mt-2 text-xs text-red-600">{emailError || "Erreur inconnue"}</div>}
                </div>
              </div>
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
              <>
                {/* Plan */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.planLabel}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {isPro && <Crown className="h-5 w-5 text-amber-500" strokeWidth={1.75} />}
                    <span className="text-xl font-bold text-slate-900">{isPro ? ac.planPro : ac.planFree}</span>
                    {isPro && planType && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        {PLAN_TYPE_LABEL[planType]}
                      </span>
                    )}
                  </div>

                  {isPro ? (
                    <p className="mt-3 text-sm text-slate-500">{ac.manageBillingHint}</p>
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

                {/* Usage — real counts, so a Pro subscriber can actually see
                    what their subscription is doing for them. */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.usageTitle}</p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <StatTile icon={MessageSquare} label={ac.usageConversations} value={String(conversationCount)} />
                    <StatTile icon={Sparkles} label={ac.usageAiReplies} value={String(aiReplyCount)} />
                    <StatTile
                      icon={CalendarDays}
                      label={isPro ? ac.memberSinceLabel : ac.usageAiToday}
                      value={isPro ? memberSinceLabel : `${aiUsedToday} / ${aiDailyLimit}`}
                    />
                  </div>

                  {isPro && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-700">
                      <Sparkles className="h-3.5 w-3.5" /> {ac.unlimitedLabel}
                    </p>
                  )}
                </div>

                {/* Billing — Pro only. Invoices and payment methods live on
                    Tebex (merchant of record); we only hold the transaction
                    reference, so this links out rather than inventing a
                    local invoice history we have no data for. */}
                {isPro && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ac.billingTitle}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{ac.billingHint}</p>

                    {transactionId && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <p className="text-xs font-medium text-slate-400">{ac.transactionRefLabel}</p>
                        <p className="mt-1 break-all font-mono text-sm text-slate-700">{transactionId}</p>
                      </div>
                    )}

                    <a
                      href={TEBEX_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
                    >
                      <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                      {ac.manageBilling}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
