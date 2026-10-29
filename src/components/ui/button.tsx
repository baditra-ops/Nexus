import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "teal"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "amber"
    | "violet"
    | "emerald"
    | "cyan";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer gap-2 active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm",
      teal:
        "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500 focus-visible:ring-teal-500 shadow-md shadow-teal-500/20",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700/90 dark:border dark:border-white/10",
      outline:
        "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-400 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-white/10 dark:backdrop-blur-sm",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-white/10",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 shadow-md shadow-rose-500/20",
      amber:
        "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 focus-visible:ring-amber-500 shadow-md shadow-amber-500/20",
      violet:
        "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 focus-visible:ring-violet-500 shadow-md shadow-violet-500/20",
      emerald:
        "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 focus-visible:ring-emerald-500 shadow-md shadow-emerald-500/20",
      cyan:
        "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 focus-visible:ring-cyan-500 shadow-md shadow-cyan-500/20",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
