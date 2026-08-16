import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}

export default function StatCard({ icon: Icon, iconClassName, label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-white/50">{label}</p>
    </div>
  );
}
