"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { getAuthErrorMessage, logSupabaseError } from "@/lib/authError";
import { useLocale } from "@/components/LocaleProvider";
import { LockIcon, SparklesIcon } from "@/components/icons/ToolIcons";
import { GoogleIcon, FacebookIcon, EnvelopeIcon, CheckCircleIcon } from "@/components/icons/AuthIcons";
import OtpCodeInput from "@/components/OtpCodeInput";
import { trackEvent } from "@/lib/analytics";

type Mode = "options" | "credentials" | "otpEmail" | "otpCode" | "success";
type Status = "idle" | "sending" | "error";
type OAuthProvider = "google" | "facebook";

const RESEND_COOLDOWN_SECONDS = 30;
const MIN_PASSWORD_LENGTH = 8;
const SUCCESS_AUTO_CONTINUE_MS = 1600;

// The exact icon set actually configured for the tool cards elsewhere in
// the app (see TOOLS in src/app/page.tsx) — not a generic placeholder set.
const TOOL_ICON_FILES = [
  "/icons/nettoyage.png",
  "/icons/generateur.png",
  "/icons/securite.png",
  "/icons/fusion.png",
  "/icons/conversion.png",
];

interface SsoButtonProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

function SsoButton({ icon, label, loading, disabled, onClick }: SsoButtonProps) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      ) : (
        <span className="transition-transform duration-150 group-hover:scale-110">{icon}</span>
      )}
      {loading ? t.auth.connecting : label}
    </button>
  );
}

/** Sign-up gets its own page with its own design (light, two-column hero +
 * form) rather than sharing /login's dark single-column layout — the two
 * entry points are deliberately not visual twins of each other. */
export default function InscriptionPageClient() {
  const router = useRouter();
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
    trackEvent("sign_up");
    const timer = setTimeout(proceedToApp, SUCCESS_AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function proceedToApp() {
    router.push("/chat");
    router.refresh();
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

  async function handleSignupSubmit(event: FormEvent) {
    event.preventDefault();
    if (AUTH_DISABLED) {
      setMode("success");
      return;
    }
    setCredError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setCredStatus("error");
      setCredError(t.auth.passwordTooShort);
      return;
    }

    setCredStatus("sending");
    try {
      // See src/app/api/auth/signup/route.ts for why this goes through our
      // own route instead of supabase.auth.signUp() directly.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        logSupabaseError("Erreur inscription :", body);
        setCredStatus("error");
        setCredError(body.error || t.auth.unknownError);
        return;
      }
      setCredStatus("idle");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setMode("otpCode");
    } catch (error) {
      logSupabaseError("Erreur inscription :", error);
      setCredStatus("error");
      setCredError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  async function sendOtpEmailCode() {
    setOtpEmailStatus("sending");
    setOtpEmailError(null);
    try {
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

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left panel — presentation, hidden on small screens */}
        <div className="hidden flex-col justify-between gap-7 bg-[#EEF7F2] p-10 lg:flex lg:p-14">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E8E5A]">
              <img src="/logo-transparent.png" alt="" className="h-5 w-5 object-contain" />
            </span>
            <span className="font-serif text-lg font-bold text-gray-900">Asexcel</span>
          </Link>

          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 to-emerald-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm">
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
              {t.auth.poweredByAI}
            </span>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900 lg:text-4xl">
              {t.auth.modalHeroTitle}
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-gray-600">{t.auth.modalHeroText}</p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#1E8E5A]/15 bg-white px-4 py-3">
            <div className="flex -space-x-2">
              {TOOL_ICON_FILES.map((src, i) => (
                <span
                  key={src}
                  className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm"
                  style={{ zIndex: TOOL_ICON_FILES.length - i }}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{t.auth.toolsCount}</span>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E8E5A]">
                  <img src="/logo-transparent.png" alt="" className="h-5 w-5 object-contain" />
                </span>
                <span className="font-serif text-lg font-bold text-gray-900">Asexcel</span>
              </Link>
              <Link href="/" className="text-xs font-medium text-gray-500 transition hover:text-gray-900">
                {t.auth.backToHome}
              </Link>
            </div>

            {mode === "success" ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircleIcon />
                <h1 className="mt-4 text-xl font-semibold tracking-tight text-gray-900">{t.auth.welcomeTitle}</h1>
                <p className="mt-1.5 text-sm text-gray-500">{t.auth.successSubtitle}</p>
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
                <div className="mb-6">
                  <h1 className="text-xl font-semibold tracking-tight text-gray-900">{t.auth.modalTitle}</h1>
                  <p className="mt-1.5 text-sm text-gray-500">{t.auth.modalSubtitle}</p>
                </div>

                {mode === "options" && (
                  <div className="space-y-2.5">
                    <SsoButton
                      icon={<GoogleIcon />}
                      label={t.auth.continueWithGoogle}
                      loading={oauthLoading === "google"}
                      disabled={oauthLoading !== null}
                      onClick={() => handleOAuth("google")}
                    />
                    <SsoButton
                      icon={<FacebookIcon />}
                      label={t.auth.continueWithFacebook}
                      loading={oauthLoading === "facebook"}
                      disabled={oauthLoading !== null}
                      onClick={() => handleOAuth("facebook")}
                    />

                    {oauthError && <p className="text-xs text-red-600">{oauthError}</p>}

                    <div className="relative py-1 text-center text-xs text-gray-400">
                      <span className="relative bg-white px-2">{t.auth.or}</span>
                      <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-gray-200" />
                    </div>

                    <SsoButton
                      icon={<EnvelopeIcon />}
                      label={t.auth.continueWithEmail}
                      loading={false}
                      disabled={oauthLoading !== null}
                      onClick={() => setMode("credentials")}
                    />
                  </div>
                )}

                {mode === "credentials" && (
                  <div>
                    <form onSubmit={handleSignupSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="signup-email" className="mb-1.5 block text-xs font-medium text-gray-600">
                          {t.auth.emailAddress}
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          autoFocus
                          placeholder={t.auth.emailPlaceholder}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                        />
                      </div>
                      <div>
                        <label htmlFor="signup-password" className="mb-1.5 block text-xs font-medium text-gray-600">
                          {t.auth.passwordLabel}
                        </label>
                        <input
                          id="signup-password"
                          type="password"
                          required
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                        />
                      </div>

                      {credError !== null && <div className="text-xs text-red-600">{credError || "Erreur inconnue"}</div>}

                      <button
                        type="submit"
                        disabled={credStatus === "sending"}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {credStatus === "sending" && (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        )}
                        {credStatus === "sending" ? t.auth.connecting : t.auth.createAccountCta}
                      </button>
                    </form>

                    <Link href="/login" className="mt-4 block w-full text-center text-xs font-medium text-gray-500 hover:text-gray-900">
                      {t.auth.switchToLogin}
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("otpEmail");
                        setCredError(null);
                      }}
                      className="mt-2 w-full text-center text-xs font-medium text-gray-400 hover:text-gray-700"
                    >
                      {t.auth.useOtpLink}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("options");
                        setCredError(null);
                      }}
                      className="mt-2 w-full text-center text-xs font-medium text-gray-400 hover:text-gray-700"
                    >
                      {t.auth.backToOptions}
                    </button>
                  </div>
                )}

                {mode === "otpEmail" && (
                  <div>
                    <form onSubmit={handleOtpEmailSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="signup-otp-email" className="mb-1.5 block text-xs font-medium text-gray-600">
                          {t.auth.emailAddress}
                        </label>
                        <input
                          id="signup-otp-email"
                          type="email"
                          required
                          autoFocus
                          placeholder={t.auth.emailPlaceholder}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                        />
                      </div>

                      {otpEmailError !== null && <div className="text-xs text-red-600">{otpEmailError || "Erreur inconnue"}</div>}

                      <button
                        type="submit"
                        disabled={otpEmailStatus === "sending"}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:opacity-60"
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
                      className="mt-4 text-xs font-medium text-gray-500 hover:text-gray-900"
                    >
                      {t.auth.usePasswordLink}
                    </button>
                  </div>
                )}

                {mode === "otpCode" && (
                  <div>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">
                      {t.auth.linkSentPrefix} <strong>{email}</strong>
                      {t.auth.linkSentSuffix}
                    </p>

                    <form onSubmit={handleCodeSubmit} className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">{t.auth.codeLabel}</label>
                        <OtpCodeInput value={code} onChange={setCode} disabled={codeStatus === "sending"} autoFocus />
                      </div>

                      {codeError !== null && <div className="text-xs text-red-600">{codeError || "Erreur inconnue"}</div>}

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
                        className="font-medium text-gray-500 hover:text-gray-900"
                      >
                        {t.auth.changeEmail}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || otpEmailStatus === "sending"}
                        className="font-medium text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resendCooldown > 0 ? t.auth.resendCodeIn.replace("{seconds}", String(resendCooldown)) : t.auth.resendCode}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-3 border-t border-gray-100 pt-5">
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <LockIcon className="h-3.5 w-3.5 shrink-0" />
                    {t.auth.dataSecure}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.auth.agreeStart}{" "}
                    <a href="/conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                      {t.auth.terms}
                    </a>{" "}
                    {t.auth.and}{" "}
                    <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                      {t.auth.privacy}
                    </a>
                    .
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
