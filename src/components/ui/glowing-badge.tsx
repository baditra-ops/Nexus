import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlowingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "teal" | "emerald" | "cyan" | "indigo" | "amber" | "rose" | "neutral";
  pulse?: boolean;
}

export function GlowingBadge({
  className,
  variant = "teal",
  pulse = true,
  children,
  ...props
}: GlowingBadgeProps) {
  const styles = {
    teal: {
      badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
      dot: "bg-teal-500",
      ring: "bg-teal-400",
    },
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      dot: "bg-emerald-500",
      ring: "bg-emerald-400",
    },
    cyan: {
      badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
      dot: "bg-cyan-500",
      ring: "bg-cyan-400",
    },
    indigo: {
      badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
      dot: "bg-indigo-500",
      ring: "bg-indigo-400",
    },
    amber: {
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      dot: "bg-amber-500",
      ring: "bg-amber-400",
    },
    rose: {
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
      dot: "bg-rose-500",
      ring: "bg-rose-400",
    },
    neutral: {
      badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      dot: "bg-slate-400",
      ring: "bg-slate-400",
    },
  };

  const selected = styles[variant] || styles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-xs",
        selected.badge,
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              selected.ring
            )}
          />
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", selected.dot)}
          />
        </span>
      )}
      {children}
    </span>
  );
}
