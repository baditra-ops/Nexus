import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "cyber" | "glow";
  glowColor?: "cyan" | "amber" | "violet" | "emerald" | "rose";
}

export function Card({
  className,
  variant = "default",
  glowColor,
  ...props
}: CardProps) {
  const glowStyles = {
    cyan: "border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)]",
    amber: "border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.12)]",
    violet: "border-violet-500/30 shadow-[0_0_25px_rgba(139,92,246,0.12)]",
    emerald: "border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)]",
    rose: "border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.12)]",
  };

  const variantStyles = {
    default:
      "rounded-2xl border border-slate-200/90 bg-white/95 text-slate-950 shadow-sm transition-all dark:border-white/10 dark:bg-slate-900/80 dark:backdrop-blur-md dark:text-slate-50 dark:hover:border-white/20",
    glass:
      "rounded-2xl border border-white/15 bg-white/80 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-50",
    cyber:
      "cyber-card rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-md transition-all dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-50",
    glow:
      "rounded-2xl border bg-white/90 backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-50 transition-all",
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        glowColor && glowStyles[glowColor],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-slate-500 dark:text-slate-400 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-auto", className)}
      {...props}
    />
  );
}
