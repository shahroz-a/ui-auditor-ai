import { cn } from "@/lib/cn";

export interface ProgressProps {
  className?: string;
  label: string;
  value: number;
}

export function Progress({ className, label, value }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">{safeValue}%</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-mint-600 transition-all" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
