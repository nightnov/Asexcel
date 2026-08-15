"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { getAuthErrorMessage, logSupabaseError } from "@/lib/authError";
import { useLocale } from "@/components/LocaleProvider";
import OtpCodeInput from "@/components/OtpCodeInput";
import { GoogleIcon, FacebookIcon, AppleIcon, MicrosoftIcon, EnvelopeIcon, CheckCircleIcon } from "@/components/icons/AuthIcons";

type Mode = "options" | "credentials" | "otpEmail" | "otpCode" | "success";
type Status = "idle" | "sending" | "error";
type OAuthProvider = "google" | "facebook" | "apple" | "azure";

const RESEND_COOLDOWN_SECONDS = 30;
const SUCCESS_AUTO_CONTINUE_MS = 1600;

interface OAuthButtonProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

function OAuthButton({ icon, label, loading, disabled, onClick }: OAuthButtonProps) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        icon
      )}
      {loading ? t.auth.connecting : label}
    </button>
  );
}

const CLEAN_ROWS = [
  { name: "Jean Dupont", value: "$1,240.00" },
  { name: "Marie Martin", value: "$860.00" },
  { name: "Julie Bernard", value: "$2,110.00" },
  { name: "Adam Petit", value: "$430.00" },
];

const DIRTY_ROWS = [
  { name: "jean DUPONT", value: "$1,240.00" },
  { name: "marie   martin", value: "$860.00" },
  { name: "JULIE bernard", value: "$2,110.00" },
  { name: "adam  Petit", value: "$430.00" },
];

/** Animated dark preview card: cycles a mini "spreadsheet" between a messy
 * and a cleaned-up state, with a looping glossy sweep and a pulsing status
 * dot — purely decorative, so every effect degrades to a static (still
 * fully readable) card under `prefers-reduced-motion`. */
function LoginVisual() {
  const [clean, setClean] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setClean((c) => !c);
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const rows = clean ? CLEAN_ROWS : DIRTY_ROWS;

  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="login-shine relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 text-xs text-white/50">
          <span className="login-pulse-glow h-2 w-2 rounded-full bg-emerald-400" />
          {clean ? "Données nettoyées" : "Nettoyage en cours..."}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
          <span className="font-serif italic text-white/40">fx</span>
          <span className="truncate font-mono">
            {clean ? "=NETTOYER(A1:A8)" : "=PROPRE(A1) & MAJUSCULE.PREMIERE(...)"}
          </span>
        </div>

        <div className="mt-3 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-black/10">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-300 ${
                flash ? "bg-emerald-400/10" : ""
              }`}
            >
              <span className={clean ? "text-white/90" : "text-white/45"}>{row.name}</span>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-white/40">{row.value}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    clean ? "bg-emerald-400" : "bg-white/15"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          Aperçu en direct — aucune donnée réelle n&apos;est traitée ici.
        </p>
      </div>
    </div>
  );
}

/** Log-in only — sign-up lives on its own page (/inscription) with its own
 * design, not a tab switch here. */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const [mode, setMode] = useState<Mode>("options");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credStatus, setCredStatus] = useState<Status>("idle");
  const [credError, setCredError] = useState<string | null>(null);

  const [otpEmailStatus, setOtpEmailStatus] = useState<Status>("idle");
  const [otpEmailError, setOtpEmailError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<Status>("idle");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (mode !== "success") return;
    const timer = setTimeout(proceedToApp, SUCCESS_AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function proceedToApp() {
    const next = searchParams.get("next") ?? "/chat";
    router.push(next);
    router.refresh();
  }

  async function sendOtpEmailCode() {
    setOtpEmailStatus("sending");
    setOtpEmailError(null);
    try {
      // See src/app/api/auth/send-code/route.ts for why this goes through
      // our own route instead of supabase.auth.signInWithOtp() directly.
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        logSupabaseError("Erreur envoi code OTP :", body);
        setOtpEmailStatus("error");
        setOtpEmailError(body.error || t.auth.unknownError);
        return false;
      }
      setOtpEmailStatus("idle");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      return true;
    } catch (error) {
      logSupabaseError("Erreur envoi code OTP :", error);
      setOtpEmailStatus("error");
      setOtpEmailError(getAuthErrorMessage(error, t.auth.unknownError));
      return false;
    }
  }

  async function handleCredentialsSubmit(event: FormEvent) {
    event.preventDefault();
    if (AUTH_DISABLED) {
      setMode("success");
      return;
    }
    setCredError(null);
    setCredStatus("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logSupabaseError("Erreur Supabase signInWithPassword :", error);
        setCredStatus("error");
        setCredError(
          error.message.includes("Invalid login credentials") ? t.auth.invalidCredentials : getAuthErrorMessage(error, t.auth.unknownError)
        );
        return;
      }
      setMode("success");
    } catch (error) {
      logSupabaseError("Erreur authentification :", error);
      setCredStatus("error");
      setCredError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  async function handleOtpEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (AUTH_DISABLED) {
      setMode("success");
      return;
    }
    if (await sendOtpEmailCode()) setMode("otpCode");
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    await sendOtpEmailCode();
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    setCodeStatus("sending");
    setCodeError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) {
        logSupabaseError("Erreur Supabase verifyOtp :", error);
        setCodeStatus("error");
        setCodeError(t.auth.invalidCode);
        return;
      }
      setMode("success");
    } catch (error) {
      logSupabaseError("Erreur Supabase verifyOtp :", error);
      setCodeStatus("error");
      setCodeError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (AUTH_DISABLED) {
      setMode("success");
      return;
    }
    setOauthLoading(provider);
    setOauthError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        logSupabaseError("Erreur Supabase OAuth :", error);
        setOauthError(t.auth.oauthUnavailable);
        setOauthLoading(null);
      }
    } catch (error) {
      logSupabaseError("Erreur Supabase OAuth :", error);
      setOauthError(t.auth.oauthUnavailable);
      setOauthLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F0D] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E8E5A]">
            <img src="/logo-transparent.png" alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="font-serif text-lg font-bold text-white">Asexcel</span>
        </Link>
        <Link href="/" className="text-xs font-medium text-white/50 transition hover:text-white">
          {t.auth.backToHome}
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-10 lg:grid-cols-2 lg:py-20">
        {/* Left — form */}
        <div className="mx-auto w-full max-w-sm">
          {mode === "success" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircleIcon />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">{t.auth.welcomeTitle}</h1>
              <p className="mt-1.5 text-sm text-white/50">{t.auth.successSubtitle}</p>
              <button
                type="button"
                onClick={proceedToApp}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44]"
              >
                {t.auth.continueCta}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.auth.welcomeTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{t.auth.welcomeSubtitle}</p>

              {mode === "options" && (
                <>
                  <div className="mt-8 space-y-2.5">
                    <OAuthButton
                      icon={<GoogleIcon />}
                      label={t.auth.continueWithGoogle}
                      loading={oauthLoading === "google"}
                      disabled={oauthLoading !== null}
                      onClick={() => handleOAuth("google")}
                    />
                    <OAuthButton
                      icon={<FacebookIcon />}
                      label={t.auth.continueWithFacebook}
                      loading={oauthLoading === "facebook"}
                      disabled={oauthLoading !== null}
                      onClick={() => handleOAuth("facebook")}
                    />
                    <OAuthButton
                      icon={<AppleIcon />}
                      label={t.auth.continueWithApple}
                      loading={oauthLoading === "apple"}
                      disabled={oauthLoading !== null}
                      onClick={() => handleOAuth("apple")}
                    />
                    <OAuthButton
                      icon={<MicrosoftIcon />}
                      label={t.auth.continueWithMicrosoft}
                      loading={oauthLoading === "azure"}
                      disabled={oauthLoading !== null}
                      onClick={() => handleOAuth("azure")}
                    />
                  </div>

                  {oauthError && <p className="mt-2 text-xs text-red-400">{oauthError}</p>}

                  <div className="relative py-5 text-center text-xs text-white/30">
                    <span className="relative bg-[#0B0F0D] px-2">{t.auth.or}</span>
                    <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-white/10" />
                  </div>

                  <OAuthButton
                    icon={<EnvelopeIcon />}
                    label={t.auth.continueWithEmail}
                    loading={false}
                    disabled={oauthLoading !== null}
                    onClick={() => setMode("credentials")}
                  />
                </>
              )}

              {mode === "credentials" && (
                <>
                  <form onSubmit={handleCredentialsSubmit} className="mt-8 space-y-3">
                    <div>
                      <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-white/60">
                        {t.auth.emailLabel}
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        required
                        autoFocus
                        placeholder={t.auth.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                      />
                    </div>

                    <div>
                      <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-white/60">
                        {t.auth.passwordLabel}
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                      />
                    </div>

                    {credError !== null && <div className="text-xs text-red-400">{credError || "Erreur inconnue"}</div>}

                    <button
                      type="submit"
                      disabled={credStatus === "sending"}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {credStatus === "sending" && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {credStatus === "sending" ? t.auth.connecting : t.auth.signInCta}
                    </button>
                  </form>

                  <Link
                    href="/inscription"
                    className="mt-4 block w-full text-center text-xs font-medium text-white/50 hover:text-white"
                  >
                    {t.auth.switchToSignup}
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("otpEmail");
                      setCredError(null);
                    }}
                    className="mt-2 w-full text-center text-xs font-medium text-white/30 hover:text-white/70"
                  >
                    {t.auth.useOtpLink}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("options");
                      setCredError(null);
                    }}
                    className="mt-2 w-full text-center text-xs font-medium text-white/30 hover:text-white/70"
                  >
                    {t.auth.backToOptions}
                  </button>
                </>
              )}

              {mode === "otpEmail" && (
                <div className="mt-8">
                  <form onSubmit={handleOtpEmailSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="login-otp-email" className="mb-1.5 block text-xs font-medium text-white/60">
                        {t.auth.emailLabel}
                      </label>
                      <input
                        id="login-otp-email"
                        type="email"
                        required
                        autoFocus
                        placeholder={t.auth.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                      />
                    </div>

                    {otpEmailError !== null && <div className="text-xs text-red-400">{otpEmailError || "Erreur inconnue"}</div>}

                    <button
                      type="submit"
                      disabled={otpEmailStatus === "sending"}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpEmailStatus === "sending" && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {otpEmailStatus === "sending" ? t.auth.sendingLink : t.auth.receiveLink}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("credentials");
                      setOtpEmailStatus("idle");
                      setOtpEmailError(null);
                    }}
                    className="mt-4 text-xs font-medium text-white/50 hover:text-white"
                  >
                    {t.auth.usePasswordLink}
                  </button>
                </div>
              )}

              {mode === "otpCode" && (
                <div className="mt-8">
                  <p className="text-sm leading-relaxed text-white/60">
                    {t.auth.linkSentPrefix} <strong className="text-white">{email}</strong>
                    {t.auth.linkSentSuffix}
                  </p>

                  <form onSubmit={handleCodeSubmit} className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">{t.auth.codeLabel}</label>
                      <OtpCodeInput value={code} onChange={setCode} disabled={codeStatus === "sending"} dark autoFocus />
                    </div>

                    {codeError !== null && <div className="text-xs text-red-400">{codeError || "Erreur inconnue"}</div>}

                    <button
                      type="submit"
                      disabled={codeStatus === "sending" || code.length !== 6}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {codeStatus === "sending" && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {codeStatus === "sending" ? t.auth.verifyingCode : t.auth.verifyCta}
                    </button>
                  </form>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("otpEmail");
                        setCode("");
                        setCodeStatus("idle");
                        setCodeError(null);
                      }}
                      className="font-medium text-white/50 hover:text-white"
                    >
                      {t.auth.changeEmail}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || otpEmailStatus === "sending"}
                      className="font-medium text-white/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? t.auth.resendCodeIn.replace("{seconds}", String(resendCooldown)) : t.auth.resendCode}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-8 text-xs leading-relaxed text-white/30">
                {t.auth.agreeStart}{" "}
                <a href="/conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">
                  {t.auth.terms}
                </a>{" "}
                {t.auth.and}{" "}
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">
                  {t.auth.privacy}
                </a>
                .
              </p>
            </>
          )}
        </div>

        {/* Right — animated visual */}
        <div className="hidden items-center justify-center lg:flex">
          <LoginVisual />
        </div>
      </div>
    </main>
  );
}
