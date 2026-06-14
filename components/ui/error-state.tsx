import { FileWarning } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface ErrorStateProps {
  action?: ReactNode;
  className?: string;
  description: string;
  title: string;
}

export function ErrorState({ action, className, description, title }: ErrorStateProps) {
  return (
    <div className={cn("grid place-items-center gap-5 rounded-lg border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950", className)}>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-rose-600 dark:bg-rose-900/70 dark:text-rose-200">
        <FileWarning aria-hidden="true" className="h-8 w-8" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-rose-950 dark:text-rose-50">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-rose-900/80 dark:text-rose-100/85">{description}</p>
      </div>
      {action}
    </div>
  );
}
