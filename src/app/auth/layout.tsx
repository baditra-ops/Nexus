import * as React from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { BackgroundGrid } from "@/components/ui/background-grid";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <BackgroundGrid className="opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <BrandLogo showSubtitle={true} />
          <Badge variant="teal" className="mt-3 text-2xs uppercase tracking-wider font-bold">
            Institutional Access Gateway
          </Badge>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-2 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          {children}
        </div>

        <p className="text-center text-2xs text-slate-500 dark:text-slate-400">
          Protected by TechCircuit Consortium security protocols and Row-Level Security.
        </p>
      </div>
    </div>
  );
}
