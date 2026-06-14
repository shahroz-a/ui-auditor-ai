import { ImagePlus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  className?: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  title: string;
}

export function EmptyState({
  className,
  description,
  primaryAction,
  secondaryAction,
  title
}: EmptyStateProps) {
  return (
    <div className={cn("grid place-items-center gap-5 rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700", className)}>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-500">
        <ImagePlus aria-hidden="true" className="h-8 w-8" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
