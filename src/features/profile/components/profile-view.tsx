"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Building2,
  CalendarCheck,
  Boxes,
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Save,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { updateProfileAction, requestVerificationAction } from "../actions";

interface ProfileViewProps {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    full_name: string | null;
    role: string;
    verification_status: string;
    verification_notes: string | null;
    verified_at: string | null;
    is_suspended: boolean;
    suspension_reason: string | null;
    created_at: string;
    institution?: {
      id: string;
      name: string;
      location: string | null;
      domain: string | null;
    } | null;
  };
  stats: {
    activeBookingsCount: number;
    hostedResourcesCount: number;
  };
}

export function ProfileView({ user, profile, stats }: ProfileViewProps) {
  // Update Profile Name State
  const [updateState, updateAction, isUpdating] = React.useActionState(updateProfileAction, null);

  // Request Verification State
  const [verifState, verifAction, isRequestingVerif] = React.useActionState(
    requestVerificationAction,
    null
  );

  const isVerified = profile.verification_status === "verified";
  const isPendingVerif = profile.verification_status === "pending";
  const isSuspended = profile.is_suspended;

  return (
    <div className="space-y-6">
      {/* Top Banner: Futuristic Holographic Researcher Credential */}
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 via-indigo-600 to-violet-500 font-black text-2xl text-white shadow-lg ring-4 ring-white/10">
              {(profile.full_name || "Member").slice(0, 2).toUpperCase()}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {profile.full_name || "Institutional Researcher"}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {profile.role.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              <div className="flex items-center gap-2 text-xs text-teal-300 pt-1">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold">{profile.institution?.name || "TechCircuit Consortium Partner"}</span>
              </div>
            </div>
          </div>

          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900 text-xs px-4"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5 text-rose-400" />
              <span>Sign Out</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Grid: Clearance & Standing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Status Card */}
        <Card className="border-slate-200 shadow-2xs dark:border-slate-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Institutional Verification Clearance
                </h3>
              </div>
              <Badge
                variant={
                  isVerified
                    ? "teal"
                    : profile.verification_status === "rejected"
                    ? "danger"
                    : isPendingVerif
                    ? "warning"
                    : "neutral"
                }
                className="capitalize text-xs font-semibold"
              >
                {profile.verification_status}
              </Badge>
            </div>

            {isVerified ? (
              <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>Account Verified & Authorized</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-teal-800 dark:text-teal-300">
                  Your academic credentials have been verified by your institutional manager. You have priority booking privileges and eligibility for restricted research equipment.
                </p>
                {profile.verified_at && (
                  <p className="mt-2 text-[10px] text-teal-700 dark:text-teal-400 font-mono">
                    Verified on: {new Date(profile.verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : isPendingVerif ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Clearance Review in Progress</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  Your institutional verification request has been queued. A facility administrator or department manager will review your affiliation.
                </p>
                {profile.verification_notes && (
                  <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                    Submission note: &ldquo;{profile.verification_notes}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Unverified accounts can browse catalog equipment. To reserve restricted laboratory apparatus, submit a verification request below.
                </p>

                {verifState?.error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{verifState.error}</span>
                  </div>
                )}

                {verifState?.message && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 p-2.5 rounded-lg border border-teal-200 dark:bg-teal-950/40 dark:border-teal-900">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{verifState.message}</span>
                  </div>
                )}

                <form action={verifAction} className="space-y-2.5">
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Enter your Department, Faculty ID, or Laboratory group reference..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <Button
                    type="submit"
                    variant="teal"
                    size="sm"
                    disabled={isRequestingVerif}
                    className="text-xs"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    <span>{isRequestingVerif ? "Submitting..." : "Request Institutional Verification"}</span>
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Standing & Fair-Use Status Card */}
        <Card className="border-slate-200 shadow-2xs dark:border-slate-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Account Standing & Fair-Use
                </h3>
              </div>
              <Badge
                variant={isSuspended ? "danger" : "teal"}
                className="capitalize text-xs font-semibold"
              >
                {isSuspended ? "Access Restricted" : "Good Standing"}
              </Badge>
            </div>

            {isSuspended ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50/70 p-3.5 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>Administrative Hold Active</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                  Your apparatus booking privileges have been suspended: {profile.suspension_reason || "Administrative review pending"}.
                </p>
                <p className="mt-2 text-[10px] text-rose-700 dark:text-rose-400">
                  Please consult your institutional administrator or laboratory manager to resolve outstanding condition or incident reports.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>Compliant Fair-Use Status</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  You are permitted up to 4 simultaneous active apparatus reservations across consortium laboratories. Zero unresolved safety holds on file.
                </p>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href="/bookings" className="block">
                <div className="rounded-lg border border-slate-200 bg-white p-3 hover:border-teal-400 transition-colors dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-medium">Active Bookings</span>
                    <CalendarCheck className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {stats.activeBookingsCount}
                  </p>
                </div>
              </Link>

              <Link href="/my-resources" className="block">
                <div className="rounded-lg border border-slate-200 bg-white p-3 hover:border-teal-400 transition-colors dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-medium">Hosted Equipment</span>
                    <Boxes className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {stats.hostedResourcesCount}
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Display Name Card */}
      <Card className="border-slate-200 shadow-2xs dark:border-slate-800">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Researcher Profile Information
          </h3>

          {updateState?.error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{updateState.error}</span>
            </div>
          )}

          {updateState?.message && (
            <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 p-2.5 rounded-lg border border-teal-200 dark:bg-teal-950/40 dark:border-teal-900">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{updateState.message}</span>
            </div>
          )}

          <form action={updateAction} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Display Name
              </label>
              <input
                type="text"
                name="fullName"
                defaultValue={profile.full_name || ""}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <Button type="submit" variant="teal" size="sm" disabled={isUpdating} className="text-xs">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
