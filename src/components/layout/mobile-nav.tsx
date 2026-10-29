"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import { BrandLogo } from "./brand-logo";
import { Badge } from "@/components/ui/badge";
import { UserNavCard } from "./user-nav-card";
import { Menu, X, Building2 } from "lucide-react";

function MobileNavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" aria-label="Mobile Navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all",
              isActive
                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white dark:from-slate-800 dark:to-slate-900 dark:text-cyan-300 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-cyan-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
                aria-hidden="true"
              />
              <span>{item.title}</span>
            </div>
            {item.badge !== undefined && (
              <Badge
                variant={isActive ? "teal" : item.badgeVariant || "neutral"}
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-mono font-bold",
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

function MobileNavFallback() {
  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" aria-label="Mobile Navigation Skeleton">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.href}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-600"
          >
            <Icon className="h-4 w-4 opacity-50" />
            <span>{item.title}</span>
          </div>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 lg:hidden dark:border-slate-800/80 dark:bg-slate-950/90">
      <BrandLogo showSubtitle={false} />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <div
        id="mobile-navigation-menu"
        className={cn(
          "fixed inset-y-0 right-0 top-16 z-50 flex w-72 flex-col border-l border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-in-out lg:hidden dark:border-slate-800 dark:bg-slate-950/95",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
            <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>TechCircuit Hub</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Node TC-2026 • Verified
          </span>
        </div>

        <React.Suspense fallback={<MobileNavFallback />}>
          <MobileNavLinks onClose={handleClose} />
        </React.Suspense>

        <div className="p-3 border-t border-slate-100 dark:border-slate-900">
          <React.Suspense fallback={<div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />}>
            {isOpen && <UserNavCard />}
          </React.Suspense>
        </div>
      </div>
    </header>
  );
}
