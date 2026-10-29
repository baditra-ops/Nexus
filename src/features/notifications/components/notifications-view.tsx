"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Clock,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import type { DbNotification } from "@/features/bookings/types";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/features/bookings/actions";

interface NotificationsViewProps {
  notifications: DbNotification[];
  currentUserId: string;
}

const CATEGORY_STYLE: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeVariant: "violet" | "rose" | "amber" | "emerald" | "cyan";
    cardBorder: string;
    cardBg: string;
    iconBg: string;
    iconText: string;
    label: string;
  }
> = {
  governance: {
    icon: ShieldCheck,
    badgeVariant: "violet",
    cardBorder: "border-violet-500/30",
    cardBg: "bg-violet-950/20",
    iconBg: "bg-violet-950/80 border-violet-500/30",
    iconText: "text-violet-400",
    label: "Governance",
  },
  incident: {
    icon: AlertTriangle,
    badgeVariant: "rose",
    cardBorder: "border-rose-500/30",
    cardBg: "bg-rose-950/20",
    iconBg: "bg-rose-950/80 border-rose-500/30",
    iconText: "text-rose-400",
    label: "Safety & Incident",
  },
  return: {
    icon: RotateCcw,
    badgeVariant: "amber",
    cardBorder: "border-amber-500/30",
    cardBg: "bg-amber-950/20",
    iconBg: "bg-amber-950/80 border-amber-500/30",
    iconText: "text-amber-400",
    label: "Return Inspection",
  },
  checkout: {
    icon: CheckCircle2,
    badgeVariant: "emerald",
    cardBorder: "border-emerald-500/30",
    cardBg: "bg-emerald-950/20",
    iconBg: "bg-emerald-950/80 border-emerald-500/30",
    iconText: "text-emerald-400",
    label: "Custody Handover",
  },
  booking: {
    icon: CalendarCheck,
    badgeVariant: "cyan",
    cardBorder: "border-cyan-500/30",
    cardBg: "bg-cyan-950/20",
    iconBg: "bg-cyan-950/80 border-cyan-500/30",
    iconText: "text-cyan-400",
    label: "Reservation",
  },
};

export function NotificationsView({
  notifications,
}: NotificationsViewProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [isPending, startTransition] = React.useTransition();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = (notificationId: string) => {
    startTransition(async () => {
      await markNotificationAsReadAction(notificationId);
      router.refresh();
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      router.refresh();
    });
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Filter Tabs & Mark All As Read */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-slate-900/60 text-slate-400 border border-white/5 hover:border-white/15 hover:text-slate-200"
            }`}
          >
            All Stream Events ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "unread"
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : unreadCount > 0
                ? "text-amber-300 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40"
                : "bg-slate-900/60 text-slate-400 border border-white/5 hover:border-white/15 hover:text-slate-200"
            }`}
          >
            <span>Unread Attention</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-300 border border-amber-500/40">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1 text-slate-400" />
            <span>Mark all events reviewed</span>
          </Button>
        )}
      </div>

      {/* Notifications Stream */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-slate-500" />}
          title={filter === "unread" ? "All alerts reviewed" : "Event stream is clear"}
          description={
            filter === "unread"
              ? "All active notices have been marked as read. New reservation clearances, calibration sign-offs, and custodian notes will arrive here."
              : "No telemetry notifications on record yet. When your research equipment requests progress or condition reports are certified, notices will stream here."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => {
            const hasLink = Boolean(n.link);
            const style = CATEGORY_STYLE[n.category] || CATEGORY_STYLE.booking;
            const Icon = style.icon;

            return (
              <Card
                key={n.id}
                className={`overflow-hidden border transition-all duration-200 ${
                  n.is_read
                    ? "border-white/5 bg-slate-900/60 backdrop-blur-md opacity-85 hover:opacity-100"
                    : `${style.cardBorder} ${style.cardBg} backdrop-blur-xl shadow-lg shadow-black/20`
                }`}
              >
                <CardContent className="p-4.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.iconBg} shadow-sm`}
                      >
                        <Icon className={`h-4 w-4 ${style.iconText}`} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {n.title}
                          </h4>
                          <Badge variant={style.badgeVariant} className="text-[10px]">
                            {style.label}
                          </Badge>
                          {!n.is_read && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-xs leading-relaxed text-slate-300">
                          {n.message}
                        </p>

                        <div className="flex items-center gap-4 pt-1.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {formatTimestamp(n.created_at)}
                          </span>

                          {hasLink && (
                            <Link
                              href={n.link!}
                              onClick={() => {
                                if (!n.is_read) handleMarkAsRead(n.id);
                              }}
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                            >
                              <span>Inspect Record</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        disabled={isPending}
                        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
