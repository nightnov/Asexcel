import type { PlanTier } from "@/lib/usePlan";

/** Per-plan upload cap for the non-AI utility tools (cleaner/comparator/converter/merger/splitter/protector). */
export const FILE_SIZE_LIMIT_MB: Record<PlanTier, number> = { guest: 5, free: 15, pro: 100 };

export function fileSizeLimitBytes(plan: PlanTier): number {
  return FILE_SIZE_LIMIT_MB[plan] * 1024 * 1024;
}

interface FileLimitsCopy {
  tooLarge: string;
  upgradeGuest: string;
  upgradeMember: string;
}

/** Builds the "{file} exceeds your plan's limit[, upgrade hint]" message, localized. */
export function buildTooLargeMessage(
  fl: FileLimitsCopy,
  plan: PlanTier,
  limitBytes: number,
  fileName: string
): string {
  const limitMb = Math.round(limitBytes / (1024 * 1024));
  const base = `${fileName} ${fl.tooLarge.replace("{limit}", String(limitMb))}`;
  if (plan === "guest") return `${base} ${fl.upgradeGuest}`;
  if (plan === "free") return `${base} ${fl.upgradeMember}`;
  return base;
}
