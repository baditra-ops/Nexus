import * as React from "react";
import { cn } from "@/lib/utils";

interface BackgroundGridProps {
  className?: string;
  children?: React.ReactNode;
}

export function BackgroundGrid({ className, children }: BackgroundGridProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden scientific-grid py-12 px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {/* Radial fade mask for soft gradient edges */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-slate-950"
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
