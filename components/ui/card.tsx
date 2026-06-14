import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-lg border border-slate-200 bg-white/88 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/82",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5", className)}>{children}</div>;
}

export function CardBody({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0 p-4 sm:p-5", className)}>{children}</div>;
}
