"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createBookingRequestAction, type BookingActionResult } from "../actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Info,
} from "lucide-react";
import type { DbResource } from "@/features/resources/types";

interface BookingRequestFormProps {
  resource: DbResource;
  currentUserId?: string | null;
}

export function BookingRequestForm({
  resource,
  currentUserId,
}: BookingRequestFormProps) {
  const isOwner = currentUserId && resource.owner_id === currentUserId;
  const isPublished = resource.status === "published";

  // Calculate default start (tomorrow 09:00) and end (tomorrow 17:00) in local time
  const getDefaultDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(17, 0, 0, 0);

    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const toLocalISO = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return {
      startStr: toLocalISO(start),
      endStr: toLocalISO(end),
    };
  };

  const defaults = React.useMemo(() => getDefaultDates(), []);
  const [startTime, setStartTime] = React.useState(defaults.startStr);
  const [endTime, setEndTime] = React.useState(defaults.endStr);

  const [state, formAction, isPending] = useActionState<BookingActionResult, FormData>(
    createBookingRequestAction,
    {}
  );

  // Compute duration in human readable form
  const durationText = React.useMemo(() => {
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return null;

    const diffHours = (e - s) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return `${diffHours.toFixed(1)} hours`;
    }
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  }, [startTime, endTime]);

  if (!currentUserId) {
    return (
      <Card className="rounded-2xl border border-slate-200/90 bg-white/80 p-1 shadow-md backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Security Deposit
            </span>
            <Badge variant={resource.deposit_amount > 0 ? "teal" : "neutral"} className="text-2xs font-bold">
              {resource.deposit_amount > 0 ? "Refundable" : "No Deposit Required"}
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              ${Number(resource.deposit_amount).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              {resource.currency || "USD"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
            Sign in with your verified institutional credentials to check real-time availability and request reservation slots.
          </div>
          <Link href={`/auth/sign-in?redirectTo=/resources/${resource.id}`} className="block">
            <Button variant="teal" size="lg" className="w-full justify-center shadow-xs">
              <User className="h-4 w-4 mr-1.5" />
              <span>Sign In to Request Booking</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isOwner) {
    return (
      <Card className="rounded-2xl border border-teal-500/30 bg-teal-50/30 p-1 shadow-md backdrop-blur-xs dark:border-teal-900/40 dark:bg-teal-950/20">
        <CardHeader className="p-5 pb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-teal-500/10 text-teal-700 border border-teal-500/30 dark:text-teal-300 w-fit">
            Custodian Profile
          </span>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
            You Manage This Apparatus
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-1 space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <p className="leading-relaxed">
            As the designated custodian for this resource, incoming booking requests from researchers will appear in your authorization queue.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/approvals">
              <Button variant="teal" size="sm" className="w-full">
                <span>Open Custodian Approvals</span>
              </Button>
            </Link>
            <Link href={`/my-resources/${resource.id}/edit`}>
              <Button variant="outline" size="sm" className="w-full">
                <span>Edit Resource Specifications</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isPublished) {
    return (
      <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-1 shadow-md dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardHeader className="p-5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Lock className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-bold">Listing Unavailable</h3>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            This apparatus listing is currently in {resource.status} mode and cannot accept reservation requests.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="sticky top-6 rounded-2xl border border-slate-200/90 bg-white/80 p-1 shadow-md backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Reservation Request
          </span>
          <Badge variant={resource.deposit_amount > 0 ? "teal" : "neutral"} className="text-2xs font-bold">
            {resource.deposit_amount > 0 ? "Refundable Deposit" : "No Deposit"}
          </Badge>
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            ${Number(resource.deposit_amount).toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {resource.currency || "USD"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="resource_id" value={resource.id} />

          {/* Error Message */}
          {state?.error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Time Window Pickers */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="booking-start-time"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span>Requested Start Date & Time</span>
              </label>
              <input
                id="booking-start-time"
                type="datetime-local"
                name="start_time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="booking-end-time"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span>Requested End Date & Time</span>
              </label>
              <input
                id="booking-end-time"
                type="datetime-local"
                name="end_time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {durationText && (
              <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <span>Calculated Duration:</span>
                <span className="font-bold text-teal-700 dark:text-teal-400 font-mono">
                  {durationText}
                </span>
              </div>
            )}
          </div>

          {/* Intended Purpose Notes */}
          <div className="space-y-1">
            <label
              htmlFor="booking-notes"
              className="text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Intended Purpose & Project Scope
            </label>
            <textarea
              id="booking-notes"
              name="request_notes"
              rows={3}
              placeholder="State your department, research topic, test protocol, or required accessories..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
              <span>Eligibility check executed automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
              <span>Auditable custody handoff on checkout</span>
            </div>
          </div>

          {/* Submit CTA */}
          <Button
            type="submit"
            variant="teal"
            size="lg"
            className="w-full justify-center shadow-xs"
            disabled={isPending}
          >
            {isPending ? (
              <span>Submitting Request...</span>
            ) : (
              <span>Request Reservation</span>
            )}
          </Button>

          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 leading-relaxed">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>
              Submitting a request does not complete checkout. The custodian reviews requirements and confirms schedule slot availability.
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
