import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function BrandLogo({ className, showSubtitle = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3 transition-transform duration-200 active:scale-95", className)}
      aria-label="Nexus Home"
    >
      {/* Brand Icon: Interlocking geometric node with dynamic gradient glow */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-cyan-400 shadow-md ring-1 ring-cyan-500/20 group-hover:ring-cyan-400/40 transition-all duration-300">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 blur-xs group-hover:from-cyan-500/20 group-hover:to-indigo-500/20" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 relative z-10 transition-transform group-hover:rotate-45 duration-300"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" className="text-cyan-400" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" className="text-teal-400" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" className="text-indigo-400" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" className="text-sky-400" />
          <path d="M10 6.5h4M6.5 10v4M14 17.5h-4M17.5 14v-4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            NEXUS
          </span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Consortium Resource Hub
          </span>
        )}
      </div>
    </Link>
  );
}
