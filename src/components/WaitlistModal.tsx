"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export default function WaitlistModal({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const w = t.pages.waitlist;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[#34D399]/25 bg-[#0F1411] p-7 shadow-[0_0_50px_-12px_rgba(52,211,153,0.4)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={w.closeLabel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          &#10005;
        </button>

        <h3 className="pr-8 text-xl font-semibold text-white">{w.title}</h3>

        {submitted ? (
          <div className="mt-5 rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 p-4 text-sm leading-relaxed text-[#34D399]">
            {w.confirmMessage}
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-white/50">{w.description}</p>
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setSubmitted(true);
              }}
            >
              <input
                type="email"
                required
                placeholder={w.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
              />
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44]"
              >
                {w.submitCta}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
