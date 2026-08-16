"use client";

import Link from "next/link";
import { usePlan } from "@/lib/usePlan";

/** Small reminder near ad slots that Pro removes ads site-wide. Hidden for
 * Pro accounts (the message would not apply to them) and while loading. */
export default function ProUpsellNote() {
  const { plan, loading } = usePlan();
  if (loading || plan === "pro") return null;

  return (
    <p className="mx-auto mt-2 max-w-md text-center text-xs text-slate-400">
      <Link href="/tarifs" className="underline hover:text-slate-600">
        Passer au plan Pro
      </Link>{" "}
      retire les publicités de toutes les pages.
    </p>
  );
}
