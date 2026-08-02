interface QuotaCounterLabels {
  loadingLabel: string;
  creditSingular: string;
  creditPlural: string;
  unlimitedLabel: string;
  resetTitle: string;
}

interface QuotaCounterProps {
  remaining: number;
  limit: number;
  unlimited?: boolean;
  loading?: boolean;
  labels: QuotaCounterLabels;
  /** Dev-only affordance: pass this (e.g. `AUTH_DISABLED ? quota.resetLocal : undefined`) to show a small reset control next to the pill. */
  onReset?: () => void;
}

/**
 * Shared "X/Y crédits IA disponibles" pill — same component, same wording, on
 * every AI-backed surface (chat, formula generator) so the global quota
 * pool reads as one consistent thing across the app, not a per-page number.
 */
export default function QuotaCounter({ remaining, limit, unlimited, loading, labels, onReset }: QuotaCounterProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400">
        {labels.loadingLabel}
      </span>
    );
  }

  if (unlimited) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
        {labels.unlimitedLabel}
      </span>
    );
  }

  const exhausted = remaining <= 0;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
          exhausted ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${exhausted ? "bg-red-500" : "bg-brand-500"}`} />
        {remaining}/{limit} {remaining > 1 ? labels.creditPlural : labels.creditSingular}
      </span>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          title={labels.resetTitle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
        >
          ↺
        </button>
      )}
    </span>
  );
}
