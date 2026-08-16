import Link from "next/link";
import AdBanner from "./AdBanner";

interface AdInterstitialModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Ad shown right after a free/guest user finishes an action (copy,
 * download, export) instead of a Pro sales pitch there. Renders nothing
 * for Pro accounts because AdBanner already hides itself for them; the
 * caller (useAdInterstitial) also skips triggering it for Pro in the
 * first place.
 */
export default function AdInterstitialModal({ open, onClose }: AdInterstitialModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <AdBanner slot="tool-result" />
        <p className="mt-3 text-center text-xs text-slate-400">
          <Link href="/tarifs" className="underline hover:text-slate-600">
            Passer au plan Pro
          </Link>{" "}
          retire les publicités.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
