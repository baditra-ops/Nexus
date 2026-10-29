"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Building2, MapPin, ShieldCheck, Layers, ArrowUpRight } from "lucide-react";
import type { ResourceWithRelations } from "../types";

export interface ResourceCardProps {
  resource: ResourceWithRelations;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const images = Array.isArray(resource.images) ? (resource.images as string[]) : [];
  const primaryImage = images.length > 0 ? images[0] : null;

  return (
    <SpotlightCard className="group flex flex-col p-0 overflow-hidden border border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/90 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-all duration-300 shadow-sm hover:shadow-xl">
      {/* Media Header with aspect ratio and overlay badges */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden dark:bg-slate-950">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
            <Layers className="h-10 w-10 stroke-[1.5]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {resource.category}
            </span>
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between pointer-events-none">
          <Badge
            variant="navy"
            className="text-[10px] uppercase font-bold tracking-wider backdrop-blur-md bg-slate-900/90 text-white border-white/20"
          >
            {resource.category || "Apparatus"}
          </Badge>
          {resource.deposit_amount > 0 ? (
            <Badge
              variant="teal"
              className="text-[10px] font-mono font-bold backdrop-blur-md bg-teal-950/80 text-teal-300 border-teal-500/30"
            >
              ${Number(resource.deposit_amount).toFixed(0)} Deposit
            </Badge>
          ) : (
            <Badge
              variant="neutral"
              className="text-[10px] font-mono backdrop-blur-md bg-slate-900/70 text-slate-300 border-white/10"
            >
              No Deposit
            </Badge>
          )}
        </div>

        {/* Bottom Floating Institution Tag */}
        <div className="absolute left-3 bottom-3 right-3 flex items-center gap-1.5 text-[11px] text-white/90 font-medium">
          <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="truncate drop-shadow-xs">
            {resource.institution?.name || "TechCircuit Consortium"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
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
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-2xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Safety clearance required</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/60">
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          ID: {resource.id.slice(0, 8)}...
        </span>

        <Link
          href={`/resources/${resource.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 group/btn"
        >
          <span>View Details & Book</span>
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </SpotlightCard>
  );
}
