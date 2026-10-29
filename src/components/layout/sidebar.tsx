"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import { BrandLogo } from "./brand-logo";
import { Badge } from "@/components/ui/badge";
import { UserNavCard } from "./user-nav-card";
import { Building2, ShieldCheck, Cpu } from "lucide-react";

function SidebarNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1.5 px-3 py-2" aria-label="Desktop Navigation Links">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
              isActive
                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm dark:from-slate-800 dark:to-slate-900 dark:text-cyan-300 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-cyan-400 before:shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive
                    ? "text-cyan-400"
                    : "text-slate-400 group-hover:text-cyan-600 dark:text-slate-500 dark:group-hover:text-cyan-400"
                )}
                aria-hidden="true"
              />
              <span>{item.title}</span>
            </div>
            {item.badge !== undefined && (
              <Badge
                variant={isActive ? "teal" : item.badgeVariant || "neutral"}
                className={cn(
                  "ml-auto text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono font-bold",
                  isActive ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30" : ""
                )}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarNavFallback() {
  return (
    <nav className="flex-1 space-y-1.5 px-3 py-2" aria-label="Navigation Skeleton">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.href}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-600"
          >
            <Icon className="h-4 w-4 shrink-0 opacity-40" />
            <span>{item.title}</span>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside
      className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white/95 lg:min-h-screen dark:lg:border-slate-800/80 dark:lg:bg-slate-950/95 backdrop-blur-md z-30"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-900">
        <BrandLogo showSubtitle={true} />
      </div>

      {/* Institutional Context Badge */}
      <div className="mx-4 my-3 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 dark:border-slate-800/80 dark:from-slate-900/80 dark:to-slate-950/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              TechCircuit Hub
            </span>
          </div>
          <span className="flex h-2 w-2 relative" title="Consortium Online">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Node TC-2026 • Verified Network
        </p>
      </div>

      {/* Navigation Links wrapped in Suspense for Next.js 16 SSR */}
      <React.Suspense fallback={<SidebarNavFallback />}>
        <SidebarNavLinks />
      </React.Suspense>

      {/* User Authentication Status Card */}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-900">
        <React.Suspense fallback={<div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />}>
          <UserNavCard />
        </React.Suspense>
      </div>

      {/* Trust & Safety Guarantee Footer */}
      <div className="border-t border-slate-100 p-3.5 dark:border-slate-900">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-[11px] font-medium">Audited Handover</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
            <Cpu className="h-3 w-3" />
            <span>AI Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
