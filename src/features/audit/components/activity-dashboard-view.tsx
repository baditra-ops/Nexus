"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  History,
  CalendarCheck,
  RotateCcw,
  AlertTriangle,
  Boxes,
  UserCog,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Terminal,
  ShieldCheck,
  Hash,
} from "lucide-react";
import type { ActivityLogWithDetails } from "@/features/admin/types";

interface ActivityDashboardViewProps {
  initialLogs: ActivityLogWithDetails[];
}

export function ActivityDashboardView({ initialLogs }: ActivityDashboardViewProps) {
  const [category, setCategory] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);

  const filteredLogs = initialLogs.filter((log) => {
    if (category === "bookings" && !log.action_type.startsWith("booking_")) return false;
    if (category === "governance" && !log.action_type.startsWith("member_") && !log.action_type.startsWith("institution_"))
      return false;
    if (category === "incidents" && !log.action_type.startsWith("incident_")) return false;
    if (category === "resources" && !log.action_type.startsWith("resource_")) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchAction = log.action_type.toLowerCase().includes(q);
      const matchActor = log.actor?.full_name?.toLowerCase().includes(q);
      const matchResource = log.resource?.title?.toLowerCase().includes(q);
      return matchAction || matchActor || matchResource;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("rejected") || action.includes("suspended") || action.includes("damage")) {
      return { variant: "rose" as const, dot: true };
    }
    if (action.includes("verified") || action.includes("approved") || action.includes("completed")) {
      return { variant: "emerald" as const, dot: true };
    }
    if (action.includes("requested") || action.includes("pending") || action.includes("waitlist")) {
      return { variant: "amber" as const, dot: true };
    }
    if (action.includes("admin") || action.includes("role") || action.includes("member")) {
      return { variant: "violet" as const, dot: true };
    }
    return { variant: "cyan" as const, dot: true };
  };

  const getActionTheme = (action: string) => {
    if (action.startsWith("incident_")) {
      return {
        icon: AlertTriangle,
        iconClass: "text-rose-400",
        boxBg: "bg-rose-950/40 border-rose-500/30",
        borderClass: "hover:border-rose-500/40",
      };
    }
    if (action.startsWith("member_") || action.startsWith("institution_")) {
      return {
        icon: UserCog,
        iconClass: "text-violet-400",
        boxBg: "bg-violet-950/40 border-violet-500/30",
        borderClass: "hover:border-violet-500/40",
      };
    }
    if (action.includes("return")) {
      return {
        icon: RotateCcw,
        iconClass: "text-amber-400",
        boxBg: "bg-amber-950/40 border-amber-500/30",
        borderClass: "hover:border-amber-500/40",
      };
    }
    if (action.startsWith("resource_")) {
      return {
        icon: Boxes,
        iconClass: "text-emerald-400",
        boxBg: "bg-emerald-950/40 border-emerald-500/30",
        borderClass: "hover:border-emerald-500/40",
      };
    }
    return {
      icon: CalendarCheck,
      iconClass: "text-cyan-400",
      boxBg: "bg-cyan-950/40 border-cyan-500/30",
      borderClass: "hover:border-cyan-500/40",
    };
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexus_activity_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: `All Events (${initialLogs.length})` },
            { id: "bookings", label: "Bookings & Loans" },
            { id: "governance", label: "Governance & Roles" },
            { id: "incidents", label: "Safety & Incidents" },
            { id: "resources", label: "Resource Lifecycle" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                category === cat.id
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-slate-900/60 text-slate-400 border border-white/5 hover:border-white/15 hover:text-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search hash, actor, apparatus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          {filteredLogs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportJson} className="h-9 text-xs">
              <Download className="h-3.5 w-3.5 mr-1 text-cyan-400" />
              <span>Export Ledger</span>
            </Button>
          )}
        </div>
      </div>

      {/* Ledger Stream */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="h-8 w-8 text-slate-500" />}
          title="No matching ledger entries"
          description="There are no immutable activity logs matching your current filter selection or search query."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const theme = getActionTheme(log.action_type);
            const badgeMeta = getActionBadge(log.action_type);
            const Icon = theme.icon;

            return (
              <Card
                key={log.id}
                className={`overflow-hidden border border-white/10 bg-slate-900/80 backdrop-blur-xl transition-all duration-200 ${theme.borderClass} hover:shadow-lg hover:shadow-black/20`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.boxBg} shadow-sm`}
                      >
                        <Icon className={`h-4 w-4 ${theme.iconClass}`} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={badgeMeta.variant}
                            dot={badgeMeta.dot}
                            className="font-mono text-[10px]"
                          >
                            {log.action_type}
                          </Badge>

                          <span className="text-xs font-bold text-white">
                            {log.actor?.full_name || "Nexus Automated Protocol"}
                          </span>

                          {log.actor?.role && (
                            <Badge variant="neutral" className="text-[9px] uppercase tracking-wider font-mono">
                              {log.actor.role}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {log.resource && (
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-500">Target:</span>
                              <Link
                                href={`/resources/${log.resource.id}`}
                                className="font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
                              >
                                {log.resource.title}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            </span>
                          )}

                          {log.booking_id && (
                            <span className="flex items-center gap-1">
                              <span className="text-slate-500">Booking Ref:</span>
                              <span className="font-mono text-[11px] text-violet-300">
                                #{log.booking_id.slice(0, 8)}
                              </span>
                            </span>
                          )}

                          {log.resource?.category && (
                            <span className="flex items-center gap-1">
                              <span className="text-slate-500">Domain:</span>
                              <span className="text-slate-300 font-medium">{log.resource.category}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <Terminal className="h-3 w-3" />
                          <span>{isExpanded ? "Hide Payload" : "Inspect Payload"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON Payload */}
                  {isExpanded && log.details && (
                    <div className="mt-3.5 rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-[11px] text-cyan-300 overflow-x-auto shadow-inner">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-slate-500 text-[10px]">
                        <span>EVENT_ID: {log.id}</span>
                        <span>FORMAT: APPLICATION/JSON</span>
                      </div>
                      <pre className="text-slate-300 leading-relaxed">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
