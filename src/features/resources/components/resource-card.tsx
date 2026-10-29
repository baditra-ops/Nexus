"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Building2, MapPin, ShieldCheck, Layers, ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { ResourceWithRelations } from "../types";

export interface ResourceCardProps {
  resource: ResourceWithRelations;
}

const getCategoryTheme = (category: string) => {
  switch (category) {
    case "Fabrication & CNC":
      return {
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        dot: "bg-amber-500",
        borderHover: "hover:border-amber-500/40",
        btn: "text-amber-600 dark:text-amber-400 hover:text-amber-700",
        glow: "hover:shadow-[0_0_30px_-8px_rgba(245,158,11,0.25)]",
      };
    case "Electronics & Embedded Kits":
      return {
        badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
        dot: "bg-violet-500",
        borderHover: "hover:border-violet-500/40",
        btn: "text-violet-600 dark:text-violet-400 hover:text-violet-700",
        glow: "hover:shadow-[0_0_30px_-8px_rgba(139,92,246,0.25)]",
      };
    case "Optics & Imaging":
      return {
        badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
        dot: "bg-cyan-500",
        borderHover: "hover:border-cyan-500/40",
        btn: "text-cyan-600 dark:text-cyan-400 hover:text-cyan-700",
        glow: "hover:shadow-[0_0_30px_-8px_rgba(6,182,212,0.25)]",
      };
    case "Biotechnology & Life Sciences":
      return {
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        dot: "bg-emerald-500",
        borderHover: "hover:border-emerald-500/40",
        btn: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700",
        glow: "hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.25)]",
      };
    case "Robotics & Automation":
      return {
        badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        dot: "bg-rose-500",
        borderHover: "hover:border-rose-500/40",
        btn: "text-rose-600 dark:text-rose-400 hover:text-rose-700",
        glow: "hover:shadow-[0_0_30px_-8px_rgba(244,63,94,0.25)]",
      };
    default:
      return {
        badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        dot: "bg-indigo-500",
        borderHover: "hover:border-indigo-500/40",
        btn: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700",
        glow: "hover:shadow-[0_0_30px_-8px_rgba(99,102,241,0.25)]",
      };
  }
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const images = Array.isArray(resource.images) ? (resource.images as string[]) : [];
  const primaryImage = images.length > 0 ? images[0] : null;
  const theme = getCategoryTheme(resource.category);

  return (
    <SpotlightCard className={`group flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70 transition-all duration-300 shadow-xs hover:shadow-xl ${theme.borderHover} ${theme.glow}`}>
      {/* Media Header with aspect ratio and overlay badges */}
      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900">
            <Layers className="h-10 w-10 stroke-[1.25]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              {resource.category}
            </span>
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between pointer-events-none">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs uppercase font-extrabold tracking-wider backdrop-blur-md border ${theme.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
            {resource.category}
          </span>

          {resource.deposit_amount > 0 ? (
            <span className="px-2.5 py-1 rounded-full text-3xs font-mono font-bold backdrop-blur-md bg-black/60 text-white border border-white/20">
              ${Number(resource.deposit_amount).toFixed(0)} Deposit
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-3xs font-mono font-semibold backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Zero Deposit
            </span>
          )}
        </div>

        {/* Bottom Floating Institution Tag */}
        <div className="absolute left-3 bottom-3 right-3 flex items-center justify-between text-white/90">
          <div className="flex items-center gap-1.5 text-2xs font-medium truncate max-w-[70%]">
            <Building2 className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <span className="truncate drop-shadow-xs">
              {resource.institution?.name || "TechCircuit Consortium"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Verified
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-base font-black tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
            <Link href={`/resources/${resource.id}`}>
              {resource.title}
            </Link>
          </h3>

          {resource.description && (
            <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {resource.description}
            </p>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="space-y-1.5 pt-1 text-xs">
          {resource.location && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{resource.location}</span>
            </div>
          )}

          {resource.eligibility_requirements && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-2xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="truncate">Safety clearance required</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/60">
        <span className="text-2xs font-mono text-slate-400">
          REF: #{resource.id.slice(0, 8)}
        </span>

        <Link
          href={`/resources/${resource.id}`}
          className={`inline-flex items-center gap-1 text-xs font-bold transition-colors group/btn ${theme.btn}`}
        >
          <span>Reserve Apparatus</span>
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </SpotlightCard>
  );
}
