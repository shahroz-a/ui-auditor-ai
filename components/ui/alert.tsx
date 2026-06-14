import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  children: ReactNode;
  className?: string;
  title: string;
  tone?: AlertTone;
}

const toneClasses: Record<AlertTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  danger: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle
};

export function Alert({ children, className, title, tone = "info" }: AlertProps) {
  const Icon = icons[tone];

  return (
    <div className={cn("flex gap-3 rounded-md border p-4", toneClasses[tone], className)} role="status">
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-6 opacity-90">{children}</div>
      </div>
    </div>
  );
}
