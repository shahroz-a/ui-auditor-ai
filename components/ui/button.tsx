import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-mint-600 text-white hover:bg-mint-500 focus-visible:ring-mint-500",
  secondary:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-mint-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost:
    "text-slate-700 hover:bg-slate-100 focus-visible:ring-mint-500 dark:text-slate-200 dark:hover:bg-slate-800",
  danger: "bg-coral-600 text-white hover:bg-coral-500 focus-visible:ring-coral-500"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      icon,
      loading = false,
      size = "md",
      type = "button",
      variant = "primary",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 dark:focus-visible:ring-offset-slate-950",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : icon}
        {size !== "icon" ? children : <span className="sr-only">{children}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
