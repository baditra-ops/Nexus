import * as React from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  badge,
  href,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-2xl group/bento hover:shadow-lg transition-all duration-300 p-5 bg-white border border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-teal-500/40 dark:hover:border-teal-400/30 relative overflow-hidden",
        onClick || href ? "cursor-pointer" : "",
        className
      )}
    >
      {/* Top subtle highlight */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-24 w-24 rounded-full bg-teal-500/5 blur-2xl group-hover/bento:bg-teal-500/15 transition-all duration-300"
        aria-hidden="true"
      />

      {header && <div className="w-full">{header}</div>}

      <div className="group-hover/bento:translate-x-1 transition duration-200">
        <div className="flex items-center justify-between mb-2">
          {icon && (
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 group-hover/bento:scale-105 transition-transform">
              {icon}
            </div>
          )}
          {badge && <div>{badge}</div>}
        </div>
        {title && (
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 tracking-tight">
            {title}
          </div>
        )}
        {description && (
          <div className="font-normal text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </div>
  );

  return content;
}
