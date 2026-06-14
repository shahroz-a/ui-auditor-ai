import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, ...props }, ref) => {
    return (
      <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={id}>
        {label ? <span>{label}</span> : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-mint-600 focus:ring-2 focus:ring-mint-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
            className
          )}
          {...props}
        />
      </label>
    );
  }
);

Input.displayName = "Input";
