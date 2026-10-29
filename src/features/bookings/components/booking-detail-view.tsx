"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  ClipboardCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { BookingWithRelations, DbConditionReport, DbIncident } from "../types";
import { CheckoutDialog } from "./checkout-dialog";
import { ReturnDialog } from "./return-dialog";
import { ReturnInspectionDialog } from "./return-inspection-dialog";
import { IncidentDialog } from "./incident-dialog";
import { IncidentResolutionDialog } from "./incident-resolution-dialog";
import { cancelBookingAction } from "../actions";

interface BookingDetailViewProps {
  booking: BookingWithRelations;
  currentUserId: string;
}

export function BookingDetailView({ booking, currentUserId }: BookingDetailViewProps) {
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [inspectionOpen, setInspectionOpen] = React.useState(false);
  const [incidentOpen, setIncidentOpen] = React.useState(false);
  const [selectedIncidentForResolve, setSelectedIncidentForResolve] = React.useState<DbIncident | null>(null);

  const [isCancelling, startCancelTransition] = React.useTransition();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const resource = booking.resource;
  const isBorrower = booking.borrower_id === currentUserId;
  const isCustodian = resource?.owner_id === currentUserId;

  const checkoutReport = (booking.condition_reports || []).find(
    (r: DbConditionReport) => r.stage === "checkout"
  );
  const returnReport = (booking.condition_reports || []).find(
    (r: DbConditionReport) => r.stage === "return"
  );

  const handleRefresh = () => {
    router.refresh();
  };

  const handleCancelBooking = () => {
    if (!confirm("Are you sure you want to cancel this booking reservation?")) return;
    setActionError(null);
    startCancelTransition(async () => {
      const res = await cancelBookingAction(
        booking.id,
        isBorrower ? "Cancelled by borrower" : "Cancelled by custodian"
      );
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  // Format dates
  const formatDateTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString(undefined, {
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

  // Stepper phases
  const phases = [
    { key: "requested", label: "Requested" },
    { key: "approved", label: "Approved" },
    { key: "checked_out", label: "Checked Out" },
    { key: "returned", label: "Returned" },
    { key: "completed", label: "Completed" },
  ];

  const getPhaseIndex = (status: string) => {
    switch (status) {
      case "requested":
        return 0;
      case "approved":
        return 1;
      case "checked_out":
        return 2;
      case "returned":
        return 3;
      case "completed":
        return 4;
      default:
        return -1;
    }
  };

  const currentPhaseIndex = getPhaseIndex(booking.status);

  // Status Badge
  const renderStatusBadge = () => {
    if (booking.is_overdue) {
      return (
        <Badge variant="danger" className="text-xs">
          Overdue by {booking.overdue_duration_text}
        </Badge>
      );
    }
    switch (booking.status) {
      case "approved":
        return <Badge variant="teal">Approved — Handover Ready</Badge>;
      case "checked_out":
        return <Badge variant="teal">Active Loan / In Custody</Badge>;
      case "returned":
        return <Badge variant="warning">Returned — Inspection Pending</Badge>;
      case "completed":
        return <Badge variant="success">Completed & Closed</Badge>;
      case "requested":
        return <Badge variant="warning">Awaiting Custodian Approval</Badge>;
      case "waitlisted":
        return <Badge variant="navy">Waitlisted #{booking.waitlist_position || 1}</Badge>;
      case "rejected":
        return <Badge variant="danger">Request Declined</Badge>;
      case "cancelled":
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{booking.status}</Badge>;
    }
  };

  const images = Array.isArray(resource?.images) ? (resource.images as string[]) : [];
  const primaryImage = images.length > 0 ? images[0] : null;

  return (
    <div className="space-y-6">
      {/* Overdue Warning Alert Banner */}
      {booking.is_overdue && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 shadow-xs dark:border-rose-900 dark:bg-rose-950/40">
          <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Apparatus Return Overdue ({booking.overdue_duration_text})
            </h3>
            <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300">
              The scheduled reservation deadline was{" "}
              <strong>{formatDateTime(booking.end_time)}</strong>. The apparatus has not yet been
              returned to the custodian. Please coordinate handover immediately to avoid institutional escalation.
            </p>
          </div>
          {booking.status === "checked_out" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setReturnOpen(true)}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Submit Return Now
            </Button>
          )}
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header & Quick Action Card */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 p-6 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-2xs font-extrabold uppercase tracking-widest text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  RESERVATION #{booking.id.slice(0, 8)}
                </span>
                {renderStatusBadge()}
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {resource?.title || "Apparatus Reservation"}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-teal-500" />
                  {resource?.institution?.name || "Shared Laboratory"}
                </span>
                {resource?.location && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {resource.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-mono text-2xs">
                  <Clock className="h-3.5 w-3.5 text-cyan-500" />
                  {formatDateTime(booking.start_time)} → {formatDateTime(booking.end_time)}
                </span>
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
              {/* Handover / Checkout Action */}
              {booking.status === "approved" && (
                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => setCheckoutOpen(true)}
                  className="rounded-xl shadow-xs px-4"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  {isCustodian ? "Perform Handover / Checkout" : "Acknowledge Safety & Checkout"}
                </Button>
              )}

              {/* Return Action */}
              {booking.status === "checked_out" && (
                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => setReturnOpen(true)}
                  className="rounded-xl shadow-xs px-4"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Submit Return
                </Button>
              )}

              {/* Custodian Return Inspection Action */}
              {booking.status === "returned" && isCustodian && (
                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => setInspectionOpen(true)}
                  className="rounded-xl shadow-xs px-4"
                >
                  <ClipboardCheck className="h-4 w-4 mr-1.5" />
                  Inspect Return Condition
                </Button>
              )}

              {/* Report Incident Action */}
              {["approved", "checked_out", "returned", "completed"].includes(booking.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncidentOpen(true)}
                  className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <AlertTriangle className="h-4 w-4 mr-1.5 text-rose-500" />
                  Report Incident
                </Button>
              )}

              {/* Cancel Button */}
              {["requested", "waitlisted", "approved"].includes(booking.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
              )}

              {/* Resource Catalog Link */}
              <Link href={`/resources/${resource?.id}`}>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Apparatus Page
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Lifecycle Stepper with glowing connectors */}
          {currentPhaseIndex >= 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                CUSTODY LIFECYCLE PROGRESS
              </span>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {phases.map((phase, idx) => {
                  const isDone = idx < currentPhaseIndex;
                  const isCurrent = idx === currentPhaseIndex;

                  return (
                    <div
                      key={phase.key}
                      className={`relative flex items-center gap-2.5 rounded-xl p-3 transition-all ${
                        isCurrent
                          ? "bg-teal-500/15 border border-teal-500/40 shadow-xs dark:bg-teal-950/50 dark:border-teal-700"
                          : isDone
                          ? "bg-emerald-500/10 border border-emerald-500/20 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                          : "bg-slate-50 dark:bg-slate-800/20 border border-transparent opacity-40"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-teal-600 text-white animate-pulse"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-bold truncate ${
                          isCurrent
                            ? "text-teal-900 dark:text-teal-200"
                            : isDone
                            ? "text-emerald-900 dark:text-emerald-200"
                            : "text-slate-400"
                        }`}
                      >
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Grid: Condition Dossier & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Condition Reports Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Condition Reports Dossier */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  Apparatus Condition Reports & Inspection Dossier
                </CardTitle>
                <Badge variant="neutral" className="text-xs">
                  {booking.condition_reports?.length || 0} Reports Filed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Checkout Report Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/20">
                <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Phase 1: Handover & Checkout
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Baseline Handover Condition
                    </h4>
                  </div>
                  {checkoutReport ? (
                    <Badge variant="teal" className="text-xs">
                      Recorded & Verified
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-xs">
                      Pending Handover
                    </Badge>
                  )}
                </div>

                {checkoutReport ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Observations: </strong>
                      {checkoutReport.notes}
                    </p>

                    {checkoutReport.safety_acknowledged && (
                      <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Safety instructions acknowledged prior to release.</span>
                      </div>
                    )}

                    {Array.isArray(checkoutReport.photos) && checkoutReport.photos.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Handover Photographs:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {(checkoutReport.photos as string[]).map((photoUrl, i) => (
                            <a
                              key={i}
                              href={photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 hover:opacity-90"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoUrl}
                                alt={`Checkout condition ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span>Logged: {formatDateTime(checkoutReport.reported_at || checkoutReport.created_at)}</span>
                      <span>Reporter ID: {checkoutReport.reporter_id.slice(0, 8)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Baseline condition and safety checklist will be recorded when the approved apparatus is checked out.
                  </div>
                )}
              </div>

              {/* Return Report Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/20">
                <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Phase 2: Apparatus Return
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Return Condition & Observations
                    </h4>
                  </div>
                  {returnReport ? (
                    returnReport.is_late ? (
                      <Badge variant="warning" className="text-xs">
                        Late Return ({returnReport.late_minutes}m)
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-xs">
                        On-Time Return
                      </Badge>
                    )
                  ) : (
                    <Badge variant="neutral" className="text-xs">
                      Awaiting Return
                    </Badge>
                  )}
                </div>

                {returnReport ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Borrower Notes: </strong>
                      {returnReport.notes}
                    </p>

                    {returnReport.issues_flagged && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Discrepancies Reported:</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(returnReport.issue_types || []).map((t, idx) => (
                            <Badge key={idx} variant="danger" className="text-[10px] uppercase">
                              {t.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(returnReport.photos) && returnReport.photos.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Return Photographs:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {(returnReport.photos as string[]).map((photoUrl, i) => (
                            <a
                              key={i}
                              href={photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 hover:opacity-90"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoUrl}
                                alt={`Return condition ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inspection Review Decision on return */}
                    {returnReport.review_status && returnReport.review_status !== "pending" && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <ClipboardCheck className="h-4 w-4 text-teal-600" />
                            Custodian Inspection Decision:
                          </span>
                          <Badge
                            variant={returnReport.review_status === "approved" ? "success" : "danger"}
                            className="text-[10px]"
                          >
                            {returnReport.review_status.toUpperCase()}
                          </Badge>
                        </div>
                        {returnReport.review_notes && (
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {returnReport.review_notes}
                          </p>
                        )}
                        {returnReport.reviewed_at && (
                          <span className="mt-1 block text-[10px] text-slate-400">
                            Inspected on {formatDateTime(returnReport.reviewed_at)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span>Submitted: {formatDateTime(returnReport.reported_at || returnReport.created_at)}</span>
                      <span>Reporter ID: {returnReport.reporter_id.slice(0, 8)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Return condition report and photographs will be submitted by the borrower upon loan conclusion.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Incidents & Discrepancies Section */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Incidents & Discrepancies
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncidentOpen(true)}
                  className="text-xs text-rose-600 hover:bg-rose-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-500" />
                  Report New Incident
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {(!booking.incidents || booking.incidents.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No incident reports or condition discrepancies have been filed for this reservation.
                </div>
              ) : (
                <div className="space-y-4">
                  {booking.incidents.map((incident: DbIncident) => {
                    const photos = Array.isArray(incident.photos) ? (incident.photos as string[]) : [];

                    return (
                      <div
                        key={incident.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                              {incident.incident_type.replace("_", " ")}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                              Incident #{incident.id.slice(0, 8)}
                            </h4>
                          </div>
                          <Badge
                            variant={
                              incident.status === "resolved"
                                ? "success"
                                : incident.status === "dismissed"
                                ? "neutral"
                                : incident.status === "under_review"
                                ? "warning"
                                : "danger"
                            }
                            className="text-[10px]"
                          >
                            {incident.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {incident.description}
                        </p>

                        {photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {photos.map((photoUrl, i) => (
                              <a
                                key={i}
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-16 w-16 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photoUrl}
                                  alt={`Incident photo ${i + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {incident.resolution_notes && (
                          <div className="rounded-md border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Remediation / Resolution:{" "}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {incident.resolution_notes}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span>Reported: {formatDateTime(incident.created_at)}</span>
                          {isCustodian && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedIncidentForResolve(incident)}
                              className="h-7 text-xs px-2.5"
                            >
                              Update Status
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Apparatus Snapshot & Participants */}
        <div className="space-y-6">
          {/* Apparatus Media & Specification */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            {primaryImage ? (
              <div className="h-48 w-full bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primaryImage}
                  alt={resource?.title || "Apparatus"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 w-full bg-slate-100 flex items-center justify-center text-slate-400 dark:bg-slate-800">
                <Building2 className="h-10 w-10 stroke-1" />
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  {resource?.category || "Apparatus"}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {resource?.title}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Institution:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {resource?.institution?.name || "Shared"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Custodian:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {resource?.owner?.full_name || "Facility Manager"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Borrower:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {booking.borrower?.full_name || "Institutional Researcher"}
                  </span>
                </div>
              </div>

              {resource?.usage_rules && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Usage & Safety Directives
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed line-clamp-3">
                    {resource.usage_rules}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Policy & Duration Card */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reservation Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">Scheduled Handover Start:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {formatDateTime(booking.start_time)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Scheduled Return Deadline:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {formatDateTime(booking.end_time)}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Current Booking Status:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {booking.status.toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Modals */}
      <CheckoutDialog
        booking={booking}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleRefresh}
      />

      <ReturnDialog
        booking={booking}
        isOpen={returnOpen}
        onClose={() => setReturnOpen(false)}
        onSuccess={handleRefresh}
      />

      <ReturnInspectionDialog
        booking={booking}
        isOpen={inspectionOpen}
        onClose={() => setInspectionOpen(false)}
        onSuccess={handleRefresh}
      />

      <IncidentDialog
        booking={booking}
        isOpen={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        onSuccess={handleRefresh}
      />

      {selectedIncidentForResolve && (
        <IncidentResolutionDialog
          incident={selectedIncidentForResolve}
          isOpen={true}
          onClose={() => setSelectedIncidentForResolve(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
