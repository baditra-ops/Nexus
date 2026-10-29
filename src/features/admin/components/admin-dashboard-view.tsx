"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  UserCog,
  Search,
  ExternalLink,
  History,
  Sparkles,
} from "lucide-react";
import { AIUtilizationDashboard } from "@/features/ai/components/ai-utilization-dashboard";
import type {
  MemberWithDetails,
  InstitutionMetrics,
  InstitutionLoanSummary,
  ActivityLogWithDetails,
} from "../types";
import type { DbIncident } from "@/features/bookings/types";
import { MemberVerificationDialog } from "./member-verification-dialog";
import { MemberRoleDialog } from "./member-role-dialog";
import { MemberSuspendDialog } from "./member-suspend-dialog";

interface AdminDashboardViewProps {
  currentUserId: string;
  institutionName: string;
  metrics: InstitutionMetrics;
  initialMembers: MemberWithDetails[];
  initialLoans: InstitutionLoanSummary[];
  initialIncidents: DbIncident[];
  initialLogs: ActivityLogWithDetails[];
}

export function AdminDashboardView({
  currentUserId,
  institutionName,
  metrics,
  initialMembers,
  initialLoans,
  initialIncidents,
  initialLogs,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = React.useState<"members" | "loans" | "incidents" | "audit" | "ai_insights">("members");
  const [memberFilter, setMemberFilter] = React.useState<string>("all");
  const [memberSearch, setMemberSearch] = React.useState<string>("");

  // Dialog State
  const [verifyingMember, setVerifyingMember] = React.useState<MemberWithDetails | null>(null);
  const [roleMember, setRoleMember] = React.useState<MemberWithDetails | null>(null);
  const [suspendMember, setSuspendMember] = React.useState<MemberWithDetails | null>(null);

  // Filter members
  const filteredMembers = initialMembers.filter((m) => {
    if (memberFilter === "pending" && m.verification_status !== "pending") return false;
    if (memberFilter === "verified" && m.verification_status !== "verified") return false;
    if (memberFilter === "suspended" && !m.is_suspended) return false;
    if (memberFilter === "custodians" && m.role !== "resource_owner") return false;
    if (memberFilter === "admins" && m.role !== "institution_admin") return false;

    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      const matchName = m.full_name?.toLowerCase().includes(q);
      const matchDept = m.department?.toLowerCase().includes(q);
      return matchName || matchDept;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Institution Header Context */}
      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-xs dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              <h2 className="text-base font-bold tracking-tight">Institutional Administration Console</h2>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Facility governance, credential verifications, fair-use enforcement, and safety records for{" "}
              <span className="font-semibold text-white">{institutionName}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="text-xs py-1 px-2.5">
              Strict Auditing Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Real Governance Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="rounded-2xl border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60 hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Members</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.totalMembers}
            </p>
            <p className="mt-0.5 text-2xs text-slate-400">Institutional network</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setActiveTab("members");
            setMemberFilter("pending");
          }}
          className={`rounded-2xl border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xs cursor-pointer transition-all hover:border-amber-400 dark:border-slate-800/80 dark:bg-slate-900/60 ${
            metrics.pendingVerifications > 0
              ? "border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20"
              : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Pending Verif.</span>
              <ShieldAlert
                className={`h-4 w-4 ${
                  metrics.pendingVerifications > 0 ? "text-amber-500" : "text-slate-400"
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {metrics.pendingVerifications}
            </p>
            <p className="mt-0.5 text-2xs text-amber-600/80 font-medium">Awaiting clearance</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60 hover:border-teal-400 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Active Loans</span>
              <Boxes className="h-4 w-4 text-teal-500" />
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.activeLoans}
            </p>
            <p className="mt-0.5 text-2xs text-teal-600 dark:text-teal-400 font-medium">In borrower custody</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("loans")}
          className={`rounded-2xl border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xs cursor-pointer transition-all hover:border-rose-400 dark:border-slate-800/80 dark:bg-slate-900/60 ${
            metrics.overdueLoans > 0 ? "border-rose-400/60 bg-rose-50/40 dark:bg-rose-950/20" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Overdue Returns</span>
              <Clock
                className={`h-4 w-4 ${
                  metrics.overdueLoans > 0 ? "text-rose-500" : "text-slate-400"
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {metrics.overdueLoans}
            </p>
            <p className="mt-0.5 text-2xs text-rose-600/80 font-medium">Deadline passed</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("incidents")}
          className={`rounded-2xl border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xs cursor-pointer transition-all hover:border-amber-400 dark:border-slate-800/80 dark:bg-slate-900/60 ${
            metrics.unresolvedIncidents > 0
              ? "border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20"
              : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Safety Incidents</span>
              <AlertTriangle
                className={`h-4 w-4 ${
                  metrics.unresolvedIncidents > 0 ? "text-amber-500" : "text-slate-400"
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.unresolvedIncidents}
            </p>
            <p className="mt-0.5 text-2xs text-slate-400">Under review</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setActiveTab("members");
            setMemberFilter("suspended");
          }}
          className={`rounded-2xl border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xs cursor-pointer transition-all hover:border-rose-400 dark:border-slate-800/80 dark:bg-slate-900/60 ${
            metrics.suspendedMembers > 0 ? "border-rose-400/60 bg-rose-50/40 dark:bg-rose-950/20" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Suspended</span>
              <ShieldAlert className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.suspendedMembers}
            </p>
            <p className="mt-0.5 text-2xs text-slate-400">Access holds</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "members"
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
          }`}
        >
          Members & Verifications ({initialMembers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("loans")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "loans"
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
          }`}
        >
          <span>Apparatus Loans ({initialLoans.length})</span>
          {metrics.overdueLoans > 0 && (
            <Badge variant="danger" className="h-4 px-1.5 text-[10px]">
              {metrics.overdueLoans} overdue
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("incidents")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "incidents"
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
          }`}
        >
          <span>Safety & Incidents ({initialIncidents.length})</span>
          {metrics.unresolvedIncidents > 0 && (
            <Badge variant="warning" className="h-4 px-1.5 text-[10px]">
              {metrics.unresolvedIncidents}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "audit"
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
          }`}
        >
          Audit Ledger
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai_insights")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "ai_insights"
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span>AI Insights & Capacity</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS & VERIFICATION */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: `All (${initialMembers.length})` },
                { id: "pending", label: `Pending (${metrics.pendingVerifications})` },
                { id: "verified", label: "Verified" },
                { id: "suspended", label: `Suspended (${metrics.suspendedMembers})` },
                { id: "custodians", label: "Custodians" },
                { id: "admins", label: "Admins" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMemberFilter(f.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    memberFilter === f.id
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member or department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-slate-400" />}
              title="No institutional members found"
              description="No members match the current filter criteria or search query."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Institutional Role</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Fair-Use Standing</th>
                    <th className="py-3 px-4 text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  {filteredMembers.map((member) => {
                    const isSelf = member.id === currentUserId;
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{member.full_name}</span>
                            {isSelf && (
                              <Badge variant="neutral" className="text-[9px] py-0">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {member.department || "General Department"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              member.role === "institution_admin"
                                ? "navy"
                                : member.role === "resource_owner"
                                ? "teal"
                                : "neutral"
                            }
                            className="capitalize text-[10px]"
                          >
                            {member.role === "resource_owner"
                              ? "Custodian"
                              : member.role === "institution_admin"
                              ? "Facility Admin"
                              : "Member"}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              member.verification_status === "verified"
                                ? "teal"
                                : member.verification_status === "rejected"
                                ? "danger"
                                : "warning"
                            }
                            className="capitalize text-[10px]"
                          >
                            {member.verification_status}
                          </Badge>
                          {member.verification_notes && (
                            <p className="mt-1 text-[10px] text-slate-500 truncate max-w-xs" title={member.verification_notes}>
                              {member.verification_notes}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {member.is_suspended ? (
                            <div>
                              <Badge variant="danger" className="text-[10px]">
                                Suspended
                              </Badge>
                              {member.suspension_reason && (
                                <p className="mt-1 text-[10px] text-rose-600 truncate max-w-xs" title={member.suspension_reason}>
                                  {member.suspension_reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="neutral" className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Active / Clean
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Verify Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => setVerifyingMember(member)}
                              className="h-7 text-[11px] px-2"
                              title="Review verification credentials"
                            >
                              <ShieldCheck className="h-3 w-3 mr-1 text-teal-600" />
                              <span>Verify</span>
                            </Button>

                            {/* Role Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => setRoleMember(member)}
                              className="h-7 text-[11px] px-2"
                              title="Assign institutional roles"
                            >
                              <UserCog className="h-3 w-3 mr-1 text-slate-500" />
                              <span>Role</span>
                            </Button>

                            {/* Suspend / Reinstate Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => setSuspendMember(member)}
                              className={`h-7 text-[11px] px-2 ${
                                member.is_suspended
                                  ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                  : "text-rose-700 border-rose-300 hover:bg-rose-50"
                              }`}
                              title={member.is_suspended ? "Reinstate member access" : "Place administrative hold"}
                            >
                              {member.is_suspended ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                  <span>Reinstate</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="h-3 w-3 mr-1 text-rose-600" />
                                  <span>Hold</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPARATUS LOANS & OVERDUE TRACKING */}
      {activeTab === "loans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Active Institutional Apparatus Loans
            </h3>
            <span className="text-xs text-slate-500">
              Real-time monitoring across laboratory spaces
            </span>
          </div>

          {initialLoans.length === 0 ? (
            <EmptyState
              icon={<Boxes className="h-8 w-8 text-slate-400" />}
              title="No apparatus bookings active"
              description="No active reservations, checkouts, or pending returns are currently recorded for this institution."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="py-3 px-4">Apparatus Resource</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Scheduled Period</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  {initialLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-850 ${
                        loan.is_overdue ? "bg-rose-50/30 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{loan.resource?.title || "Apparatus"}</span>
                          {loan.is_overdue && (
                            <Badge variant="danger" className="text-[9px]">
                              OVERDUE ({loan.overdue_duration_text})
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {loan.resource?.category}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {loan.borrower?.full_name || "Borrower"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {loan.borrower?.role}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            loan.is_overdue
                              ? "danger"
                              : loan.status === "checked_out"
                              ? "teal"
                              : loan.status === "returned"
                              ? "warning"
                              : "neutral"
                          }
                          className="capitalize text-[10px]"
                        >
                          {loan.status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        <div>From: {new Date(loan.start_time).toLocaleString()}</div>
                        <div>To: {new Date(loan.end_time).toLocaleString()}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/resources/${loan.resource_id}`}
                          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium dark:text-teal-400"
                        >
                          <span>Apparatus</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAFETY & INCIDENTS */}
      {activeTab === "incidents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Institutional Incident & Damage Reports
            </h3>
            <span className="text-xs text-slate-500">
              Unresolved incidents require custodian or admin sign-off
            </span>
          </div>

          {initialIncidents.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8 text-teal-500" />}
              title="Clean safety record"
              description="No safety incidents, equipment malfunctions, or damage reports are recorded for this institution's apparatus."
            />
          ) : (
            <div className="space-y-3">
              {initialIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className={`border ${
                    incident.status === "resolved" || incident.status === "dismissed"
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-amber-300 bg-amber-50/30 dark:border-amber-900/60 dark:bg-amber-950/20"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                            {incident.incident_type.replace("_", " ")}
                          </h4>
                          <Badge
                            variant={
                              incident.severity === "critical"
                                ? "danger"
                                : incident.severity === "high"
                                ? "danger"
                                : incident.severity === "medium"
                                ? "warning"
                                : "neutral"
                            }
                            className="text-[9px] uppercase font-bold"
                          >
                            {incident.severity}
                          </Badge>
                          <Badge variant="neutral" className="text-[9px] uppercase">
                            {incident.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {incident.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>Reported: {new Date(incident.created_at).toLocaleDateString()}</span>
                          {incident.resource_id && (
                            <Link
                              href={`/resources/${incident.resource_id}`}
                              className="text-teal-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Apparatus</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INSTITUTIONAL AUDIT LEDGER */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Append-Only Institutional Audit Ledger
            </h3>
            <Link
              href="/activity"
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Open Full Ledger</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {initialLogs.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8 text-slate-400" />}
              title="No audit events recorded"
              description="Institutional actions, checkouts, returns, and role updates will appear here automatically."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Audit Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  {initialLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="neutral" className="font-mono text-[10px]">
                          {log.action_type}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                        {log.actor?.full_name || log.actor_id || "System"}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {log.resource ? (
                          <Link
                            href={`/resources/${log.resource_id}`}
                            className="text-teal-600 hover:underline"
                          >
                            {log.resource.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-3 px-4 text-[10px] font-mono text-slate-500 max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI UTILIZATION & DEMAND FORECASTING */}
      {activeTab === "ai_insights" && (
        <AIUtilizationDashboard institutionName={institutionName} />
      )}

      {/* Dialog Modals */}
      <MemberVerificationDialog
        member={verifyingMember}
        isOpen={Boolean(verifyingMember)}
        onClose={() => setVerifyingMember(null)}
      />

      <MemberRoleDialog
        member={roleMember}
        isOpen={Boolean(roleMember)}
        onClose={() => setRoleMember(null)}
        currentUserId={currentUserId}
      />

      <MemberSuspendDialog
        member={suspendMember}
        isOpen={Boolean(suspendMember)}
        onClose={() => setSuspendMember(null)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
