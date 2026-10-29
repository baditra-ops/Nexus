"use client";

import * as React from "react";
import Link from "next/link";
import { cancelBookingAction } from "../actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Layers,
} from "lucide-react";
import type { BookingWithRelations } from "../types";

interface BookingCardProps {
  booking: BookingWithRelations;
}

export function BookingCard({ booking }: BookingCardProps) {
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const resource = booking.resource;
  const isCancellable = ["requested", "waitlisted", "approved"].includes(booking.status);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await cancelBookingAction(booking.id, "Cancelled by borrower");
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  // Status Badge Configuration
  const getStatusBadge = () => {
    if (booking.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          Overdue ({booking.overdue_duration_text})
        </span>
      );
    }
    switch (booking.status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Approved &bull; Ready for Handover
          </span>
        );
      case "checked_out":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active Loan &bull; In Custody
          </span>
        );
      case "waitlisted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Waitlisted {booking.waitlist_position ? `#${booking.waitlist_position}` : ""}
          </span>
        );
      case "requested":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Awaiting Custodian Review
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Returned &bull; Inspection Pending
          </span>
        );
      case "rejected":
        return <Badge variant="danger" dot className="text-2xs font-bold">Declined</Badge>;
      case "cancelled":
        return <Badge variant="neutral" className="text-2xs font-bold">Cancelled</Badge>;
      case "completed":
        return <Badge variant="emerald" dot className="text-2xs font-bold">Completed Loan</Badge>;
      default:
        return <Badge variant="neutral" className="text-2xs">{booking.status}</Badge>;
    }
  };

  const images = Array.isArray(resource?.images) ? (resource.images as string[]) : [];
  const primaryImage = images.length > 0 ? images[0] : null;

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/70 shadow-xs backdrop-blur-xs hover:shadow-md hover:border-slate-300 transition-all dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
      <div className="flex flex-col sm:flex-row">
        {/* Media Thumbnail */}
        <div className="relative h-40 w-full sm:h-auto sm:w-52 bg-slate-950 shrink-0 overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={resource?.title || "Resource"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-500 bg-slate-900">
              <Layers className="h-8 w-8 stroke-[1.25] text-slate-600" />
              <span className="text-[10px] font-mono uppercase mt-1 tracking-wider text-slate-500">
                {resource?.category || "Apparatus"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-slate-950/30" />
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {resource?.resource_type || "Equipment"}
                </span>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <span className="text-2xs font-semibold text-slate-500">{resource?.category}</span>
              </div>
              {getStatusBadge()}
            </div>

            <CardHeader className="p-0 pt-2 pb-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                <Link
                  href={`/resources/${booking.resource_id}`}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  {resource?.title || "Unnamed Apparatus"}
                </Link>
              </CardTitle>

              {resource?.institution && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>{resource.institution.name}</span>
                  {resource.location && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{resource.location}</span>
                    </>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 pt-2 space-y-3">
              {/* Time Window */}
              <div className="flex flex-col gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-700 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>Start: <strong className="text-slate-900 dark:text-white">{formatDate(booking.start_time)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>End: <strong className="text-slate-900 dark:text-white">{formatDate(booking.end_time)}</strong></span>
                </div>
              </div>

              {/* Request Purpose Note */}
              {booking.request_notes && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Project Scope:{" "}
                  </span>
                  <span>{booking.request_notes}</span>
                </div>
              )}

              {/* Rejection / Custodian Notes */}
              {booking.decision_notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span>Custodian Review Note:</span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    {booking.decision_notes}
                  </p>
                </div>
              )}

              {/* Eligibility Check Checklist */}
              {booking.eligibility_checks && booking.eligibility_checks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Clearance Verifications
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {booking.eligibility_checks.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center gap-2 text-xs rounded-lg border border-slate-200/60 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-950"
                      >
                        {check.status === "passed" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        ) : check.status === "failed" ? (
                          <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate text-slate-700 dark:text-slate-300 text-2xs font-medium">
                          {check.requirement}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {errorMsg}
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="p-0 pt-4 flex items-center justify-between border-t border-slate-100 mt-4 dark:border-slate-800">
            <span className="text-[11px] font-mono text-slate-400">
              Requested {new Date(booking.created_at).toLocaleDateString()}
            </span>

            <div className="flex items-center gap-2">
              <Link href={`/bookings/${booking.id}`}>
                <Button variant="teal" size="sm" className="shadow-2xs">
                  <span>
                    {booking.status === "approved"
                      ? "Checkout Handover"
                      : booking.status === "checked_out"
                      ? "Initiate Return"
                      : "View Dossier"}
                  </span>
                </Button>
              </Link>

              <Link href={`/resources/${booking.resource_id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  <span>Apparatus</span>
                </Button>
              </Link>

              {isCancellable && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={handleCancel}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                >
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
