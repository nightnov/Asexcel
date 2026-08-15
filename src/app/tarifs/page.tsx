"use client";

import Link from "next/link";
import styles from "@/app/landing.module.css";
import { poppins, inter } from "@/lib/fonts";
import LandingFooter from "@/components/LandingFooter";
import { useLocale } from "@/components/LocaleProvider";

export default function TarifsPage() {
  const { t } = useLocale();
  const p = t.pages.tarifs;

  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable}`}>
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

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{p.sectionTitle}</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/50">{p.sectionSubtitle}</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Invité */}
            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">
              <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                {p.currentPlanBadge}
              </span>
              <div className="mt-4 font-serif text-lg font-semibold text-white">{p.guestName}</div>
              <div className="mt-1 text-2xl font-bold text-white">{p.guestPriceLabel}</div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-relaxed text-white/60">
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.guestFeature1}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.guestFeature2}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.guestFeature3}
                </li>
              </ul>
              <button
                type="button"
                className="mt-6 flex h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {p.guestCta}
              </button>
            </div>

            {/* Membre — featured */}
            <div className="flex flex-col rounded-3xl border border-[#34D399]/40 bg-white/[0.06] p-7 shadow-[0_0_40px_-10px_rgba(52,211,153,0.35)] backdrop-blur-xl">
              <span className="w-fit rounded-full bg-[#1E8E5A] px-3 py-1 text-[11px] font-semibold text-white">
                {p.popularBadge}
              </span>
              <div className="mt-4 font-serif text-lg font-semibold text-white">{p.memberName}</div>
              <div className="mt-1 text-2xl font-bold text-white">{p.memberPriceLabel}</div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-relaxed text-white/60">
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.memberFeature1}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.memberFeature2}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.memberFeature3}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.memberFeature4}
                </li>
              </ul>
              <Link
                href="/login?mode=signup"
                className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44]"
              >
                {p.memberCta}
              </Link>
            </div>

            {/* Pro */}
            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">
              <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                {p.proBadge}
              </span>
              <div className="mt-4 font-serif text-lg font-semibold text-white">{p.proName}</div>
              <div className="mt-1 text-2xl font-bold text-white">{p.proPriceLabel}</div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-relaxed text-white/60">
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.proFeature1}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.proFeature2}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#34D399]">✓</span>
                  {p.proFeature3}
                </li>
              </ul>
              <Link
                href="/checkout"
                className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-[#1E8E5A] text-sm font-medium text-white transition hover:bg-[#166B44]"
              >
                {p.proCta}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter dark />
    </div>
  );
}
