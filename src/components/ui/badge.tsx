import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "neutral"
    | "navy"
    | "teal"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "amber"
    | "violet"
    | "rose"
    | "emerald"
    | "cyan"
    | "purple"
    | "fuchsia";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-white/10",
    navy:
      "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100",
    teal:
      "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700/60 dark:shadow-[0_0_12px_rgba(20,184,166,0.15)]",
    success:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60 dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    warning:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60 dark:shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    danger:
      "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60 dark:shadow-[0_0_12px_rgba(244,63,94,0.15)]",
    info:
      "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60 dark:shadow-[0_0_12px_rgba(14,165,233,0.15)]",
    amber:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40 dark:shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    violet:
      "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-500/40 dark:shadow-[0_0_12px_rgba(139,92,246,0.2)]",
    rose:
      "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500/40 dark:shadow-[0_0_12px_rgba(244,63,94,0.2)]",
    emerald:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    cyan:
      "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/40 dark:shadow-[0_0_12px_rgba(6,182,212,0.2)]",
    purple:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500/40 dark:shadow-[0_0_12px_rgba(168,85,247,0.2)]",
    fuchsia:
      "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-500/40 dark:shadow-[0_0_12px_rgba(217,70,239,0.2)]",
  };

  const dotColors = {
    neutral: "bg-slate-400",
    navy: "bg-white",
    teal: "bg-teal-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    info: "bg-sky-400",
    amber: "bg-amber-400",
    violet: "bg-violet-400",
    rose: "bg-rose-400",
    emerald: "bg-emerald-400",
    cyan: "bg-cyan-400",
    purple: "bg-purple-400",
    fuchsia: "bg-fuchsia-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

