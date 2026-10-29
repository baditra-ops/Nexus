import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 border-b border-slate-200/80 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80",
        className
      )}
    >
      {/* Subtle bottom border gradient accent */}
      <div className="absolute -bottom-px left-0 h-px w-28 bg-gradient-to-r from-cyan-500 via-teal-500 to-transparent" />

      <div className="space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-400">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-cyan-500 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white font-sans">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
