"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { useLocale } from "@/components/LocaleProvider";

type Step = "email" | "code";
type SendStatus = "idle" | "sending" | "error";
type VerifyStatus = "idle" | "verifying" | "error";

const RESEND_COOLDOWN_SECONDS = 30;

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function goToChat() {
    const next = searchParams.get("next") ?? "/chat";
    router.push(next);
    router.refresh();
  }

  async function sendCode() {
    setSendStatus("sending");
    setSendError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) {
      setSendStatus("error");
      setSendError(error.message);
      return false;
    }
    setSendStatus("idle");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (AUTH_DISABLED) {
      goToChat();
      return;
    }
    if (await sendCode()) setStep("code");
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    await sendCode();
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    setVerifyStatus("verifying");
    setVerifyError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setVerifyStatus("error");
      setVerifyError(t.auth.invalidCode);
      return;
    }
    goToChat();
  }

  async function handleGoogle() {
    if (AUTH_DISABLED) {
      goToChat();
      return;
    }
    setGoogleLoading(true);
    setGoogleError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleError(t.auth.googleUnavailable);
      setGoogleLoading(false);
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
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t.auth.welcomeTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {t.auth.welcomeSubtitle}
          </p>

          {step === "email" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? t.auth.connecting : t.auth.continueWithGoogle}
              </button>

              {googleError && <p className="mt-2 text-xs text-red-400">{googleError}</p>}

              <div className="relative py-5 text-center text-xs text-white/30">
                <span className="relative bg-[#0B0F0D] px-2">{t.auth.or}</span>
                <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-white/10" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
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

                {sendError && <p className="text-xs text-red-400">{sendError}</p>}

                <button
                  type="submit"
                  disabled={sendStatus === "sending"}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendStatus === "sending" && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {sendStatus === "sending" ? t.auth.sendingLink : t.auth.receiveLink}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <div className="mt-8">
              <p className="text-sm leading-relaxed text-white/60">
                {t.auth.linkSentPrefix} <strong className="text-white">{email}</strong>
                {t.auth.linkSentSuffix}
              </p>

              <form onSubmit={handleCodeSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="login-code" className="mb-1.5 block text-xs font-medium text-white/60">
                    {t.auth.codeLabel}
                  </label>
                  <input
                    id="login-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder={t.auth.codePlaceholder}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-center text-lg tracking-[0.4em] text-white outline-none transition placeholder:text-white/25 focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
                  />
                </div>

                {verifyError && <p className="text-xs text-red-400">{verifyError}</p>}

                <button
                  type="submit"
                  disabled={verifyStatus === "verifying" || code.length !== 6}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifyStatus === "verifying" && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {verifyStatus === "verifying" ? t.auth.verifyingCode : t.auth.verifyCta}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setVerifyStatus("idle");
                    setVerifyError(null);
                  }}
                  className="font-medium text-white/50 hover:text-white"
                >
                  {t.auth.changeEmail}
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || sendStatus === "sending"}
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
        </div>

        {/* Right — animated visual */}
        <div className="hidden items-center justify-center lg:flex">
          <LoginVisual />
        </div>
      </div>
    </main>
  );
}
