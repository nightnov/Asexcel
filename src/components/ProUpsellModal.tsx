import Link from "next/link";

interface ProUpsellModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Generic "go Pro" promo — distinct from QuotaModal (which only fires once
 * the AI daily quota is actually exhausted). This one is a soft, session-
 * limited nudge shown to free/guest visitors on tool pages, not tied to any
 * hard limit being hit. See ProUpsellTrigger for the timing/frequency logic.
 */
export default function ProUpsellModal({ open, onClose }: ProUpsellModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-upsell-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-xl">
          ✨
        </div>
        <h2 id="pro-upsell-title" className="text-lg font-semibold text-slate-900">
          Passez à Asexcel Pro
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Assistant IA 100 % illimité, fichiers jusqu&apos;à 100 Mo, traitement prioritaire et zéro publicité —
          pour 9,99 $ / mois.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/tarifs"
            onClick={onClose}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Voir les tarifs
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
