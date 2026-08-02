interface QuotaModalLabels {
  guestTitle: string;
  guestMessage: string;
  guestCta: string;
  memberTitle: string;
  memberMessage: string;
  memberCta: string;
  laterCta: string;
  closeLabel: string;
}

interface QuotaModalProps {
  open: boolean;
  onClose: () => void;
  /** "guest" shows the "create an account" upsell, "free"/"pro" shows the "go Pro" upsell. */
  plan: "guest" | "free" | "pro";
  guestLimit: number;
  memberLimit: number;
  labels: QuotaModalLabels;
  onCreateAccount: () => void;
  onUpgrade: () => void;
}

export default function QuotaModal({
  open,
  onClose,
  plan,
  guestLimit,
  memberLimit,
  labels,
  onCreateAccount,
  onUpgrade,
}: QuotaModalProps) {
  if (!open) return null;

  const isGuest = plan === "guest";
  const title = isGuest ? labels.guestTitle : labels.memberTitle;
  const message = isGuest
    ? labels.guestMessage.replace("{limit}", String(guestLimit)).replace("{memberLimit}", String(memberLimit))
    : labels.memberMessage.replace("{limit}", String(memberLimit));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-xl">
          ⏳
        </div>
        <h2 id="quota-modal-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{message}</p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (isGuest) onCreateAccount();
              else onUpgrade();
            }}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {isGuest ? labels.guestCta : labels.memberCta}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            {labels.laterCta}
          </button>
        </div>
      </div>
    </div>
  );
}
