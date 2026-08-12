"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { getAuthErrorMessage, logSupabaseError } from "@/lib/authError";
import { LockIcon, SparklesIcon } from "@/components/icons/ToolIcons";
import { useLocale } from "@/components/LocaleProvider";

type OAuthProvider = "google" | "facebook" | "apple" | "azure";
type EmailStatus = "idle" | "sending" | "sent" | "error";
type CodeStatus = "idle" | "verifying" | "error";

const RESEND_COOLDOWN_SECONDS = 30;

// The exact icon set actually configured for the tool cards elsewhere in
// the app (see TOOLS in src/app/page.tsx) — not a generic placeholder set.
const TOOL_ICON_FILES = [
  "/icons/nettoyage.png",
  "/icons/generateur.png",
  "/icons/securite.png",
  "/icons/fusion.png",
  "/icons/conversion.png",
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.74z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000000" aria-hidden="true">
      <path d="M17.05 12.54c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.82 0-2.06-.92-3.4-.9-1.75.03-3.37 1.02-4.27 2.58-1.82 3.16-.46 7.83 1.31 10.4.87 1.25 1.9 2.66 3.26 2.61 1.31-.05 1.8-.85 3.39-.85 1.58 0 2.02.85 3.4.82 1.4-.02 2.29-1.28 3.15-2.53 1-1.44 1.41-2.83 1.43-2.9-.03-.01-2.74-1.05-2.78-4.22z" />
      <path d="M14.65 4.85c.72-.87 1.2-2.08 1.07-3.29-1.04.04-2.3.7-3.04 1.56-.67.77-1.25 2.01-1.09 3.19 1.16.09 2.34-.59 3.06-1.46z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

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

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-6">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-700 shadow-lg">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
        {message}
      </div>
    </div>
  );
}

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { t } = useLocale();

  const [mode, setMode] = useState<"options" | "email" | "code">("options");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!open) return null;

  function handleClose() {
    onClose();
    // Reset to a clean slate the next time the modal opens, without
    // flashing the reset mid-close animation.
    setTimeout(() => {
      setMode("options");
      setEmail("");
      setEmailStatus("idle");
      setEmailError(null);
      setCode("");
      setCodeStatus("idle");
      setCodeError(null);
      setResendCooldown(0);
      setOauthError(null);
    }, 200);
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (AUTH_DISABLED) {
      router.push("/chat");
      handleClose();
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
      // On success the browser navigates away to the provider immediately —
      // no local state to reset. We only ever get here on failure (provider
      // not enabled in the Supabase dashboard, network issue, etc.).
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

  async function sendCode() {
    setEmailStatus("sending");
    setEmailError(null);
    try {
      // Goes through our own /api/auth/send-code instead of calling
      // supabase.auth.signInWithOtp() directly — that call both generates
      // the code AND sends the e-mail via Supabase's own mailer in one
      // step, so a broken/misconfigured mailer on Supabase's side fails
      // the whole request (seen as a 500 AuthRetryableFetchError) before a
      // code is ever generated. The server route generates the code via
      // the admin API (no mailer involved) and delivers it through the
      // Resend pipeline already used for every other e-mail in this app.
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        logSupabaseError("Erreur envoi code OTP :", body);
        setEmailStatus("error");
        setEmailError(body.error || t.auth.unknownError);
        return false;
      }
      setEmailStatus("sent");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      return true;
    } catch (error) {
      logSupabaseError("Erreur envoi code OTP :", error);
      setEmailStatus("error");
      setEmailError(getAuthErrorMessage(error, t.auth.unknownError));
      return false;
    }
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (AUTH_DISABLED) {
      router.push("/chat");
      handleClose();
      return;
    }
    if (await sendCode()) setMode("code");
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    await sendCode();
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    setCodeStatus("verifying");
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
      handleClose();
      router.push("/chat");
      router.refresh();
    } catch (error) {
      logSupabaseError("Erreur Supabase verifyOtp :", error);
      setCodeStatus("error");
      setCodeError(getAuthErrorMessage(error, t.auth.unknownError));
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-3xl bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] md:grid-cols-2"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 backdrop-blur transition hover:bg-gray-100 hover:text-gray-900"
        >
          <CloseIcon />
        </button>

        {/* Left panel — presentation */}
        <div className="flex flex-col justify-between gap-7 bg-[#EEF7F2] p-8 sm:p-10">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 to-emerald-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm">
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
              {t.auth.poweredByAI}
            </span>

            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-[28px]">
              {t.auth.modalHeroTitle}
            </h2>

            <p className="text-sm leading-relaxed text-gray-600">{t.auth.modalHeroText}</p>
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

        {/* Right panel — auth options */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-6">
            <h1 id="auth-modal-title" className="text-xl font-semibold tracking-tight text-gray-900">
              {t.auth.modalTitle}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">{t.auth.modalSubtitle}</p>
          </div>

          {mode === "options" ? (
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
              <SsoButton
                icon={<AppleIcon />}
                label={t.auth.continueWithApple}
                loading={oauthLoading === "apple"}
                disabled={oauthLoading !== null}
                onClick={() => handleOAuth("apple")}
              />
              <SsoButton
                icon={<MicrosoftIcon />}
                label={t.auth.continueWithMicrosoft}
                loading={oauthLoading === "azure"}
                disabled={oauthLoading !== null}
                onClick={() => handleOAuth("azure")}
              />

              <div className="relative py-1 text-center text-xs text-gray-400">
                <span className="relative bg-white px-2">{t.auth.or}</span>
                <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-gray-200" />
              </div>

              <SsoButton
                icon={<EnvelopeIcon />}
                label={t.auth.continueWithEmail}
                loading={false}
                disabled={oauthLoading !== null}
                onClick={() => setMode("email")}
              />
            </div>
          ) : mode === "email" ? (
            <div>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label htmlFor="auth-modal-email" className="mb-1.5 block text-xs font-medium text-gray-600">
                    {t.auth.emailAddress}
                  </label>
                  <input
                    id="auth-modal-email"
                    type="email"
                    required
                    autoFocus
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                  />
                </div>

                {emailError !== null && <div className="text-xs text-red-600">{emailError || "Erreur inconnue"}</div>}

                <button
                  type="submit"
                  disabled={emailStatus === "sending"}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:opacity-60"
                >
                  {emailStatus === "sending" && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {emailStatus === "sending" ? t.auth.sendingLink : t.auth.receiveLink}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setMode("options");
                  setEmailStatus("idle");
                  setEmailError(null);
                }}
                className="mt-4 text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                {t.auth.backToOptions}
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                {t.auth.linkSentPrefix} <strong>{email}</strong>
                {t.auth.linkSentSuffix}
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-3">
                <div>
                  <label htmlFor="auth-modal-code" className="mb-1.5 block text-xs font-medium text-gray-600">
                    {t.auth.codeLabel}
                  </label>
                  <input
                    id="auth-modal-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder={t.auth.codePlaceholder}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-center text-lg tracking-[0.4em] text-gray-900 outline-none transition focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                  />
                </div>

                {codeError !== null && <div className="text-xs text-red-600">{codeError || "Erreur inconnue"}</div>}

                <button
                  type="submit"
                  disabled={codeStatus === "verifying" || code.length !== 6}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {codeStatus === "verifying" && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {codeStatus === "verifying" ? t.auth.verifyingCode : t.auth.verifyCta}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    setEmailStatus("idle");
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
                  disabled={resendCooldown > 0 || emailStatus === "sending"}
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
        </div>

        {oauthError && <ErrorToast message={oauthError} onDismiss={() => setOauthError(null)} />}
      </div>
    </div>
  );
}
