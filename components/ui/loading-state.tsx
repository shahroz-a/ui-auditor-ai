import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export interface LoadingStateProps {
  className?: string;
  label: string;
}

export function LoadingState({ className, label }: LoadingStateProps) {
  return (
    <div className={cn("grid place-items-center gap-4 rounded-lg border border-slate-200 p-8 text-center dark:border-slate-800", className)} role="status">
      <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-mint-600" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
    </div>
  );
}
