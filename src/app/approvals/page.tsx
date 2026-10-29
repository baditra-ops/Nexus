import * as React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getManagedApprovals,
  getCustodianActionCounts,
  getUserPendingBorrowerBookings,
} from "@/features/bookings/services/booking-service";
import { ApprovalCard } from "@/features/bookings/components/approval-card";
import { BookingCard } from "@/features/bookings/components/booking-card";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  CheckSquare,
  Clock,
  Clock3,
  History,
  Layers,
  LogIn,
  PlusCircle,
  ClipboardCheck,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Send,
  CalendarCheck,
} from "lucide-react";

interface ApprovalsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ApprovalsContent({ searchParams }: ApprovalsPageProps) {
  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : "pending";
  const activeView = typeof params.view === "string" ? params.view : "custodian";
  const { user } = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn className="h-6 w-6 text-teal-600" />}
        title="Sign in to access Custodian Approval Queue"
        description="Review researcher eligibility, verify prerequisites, and authorize custody requests for apparatus hosted by your laboratory."
        action={
          <Link href="/auth/sign-in?redirectTo=/approvals">
            <Button variant="teal" size="sm">
              <span>Sign In</span>
            </Button>
          </Link>
        }
      />
    );
  }

  const [bookings, counts, borrowerBookings] = await Promise.all([
    getManagedApprovals(user.id, statusFilter),
    getCustodianActionCounts(user.id),
    getUserPendingBorrowerBookings(user.id),
  ]);

  const filterTabs = [
    {
      label: `Pending Action (${counts.pendingRequests})`,
      value: "pending",
      icon: Clock,
      highlight: counts.pendingRequests > 0,
      highlightColor: "amber",
    },
    {
      label: `Awaiting Inspection (${counts.awaitingInspection})`,
      value: "inspection",
      icon: ClipboardCheck,
      highlight: counts.awaitingInspection > 0,
      highlightColor: "amber",
    },
    {
      label: `Overdue Loans (${counts.overdueLoans})`,
      value: "overdue",
      icon: AlertCircle,
      highlight: counts.overdueLoans > 0,
      highlightColor: "rose",
    },
    {
      label: `Active Loans (${counts.activeLoans})`,
      value: "active",
      icon: ShieldCheck,
      highlight: false,
    },
    { label: "Waitlist Queue", value: "waitlist", icon: Clock3, highlight: false },
    { label: "Decision History", value: "decided", icon: History, highlight: false },
    { label: "All Requests", value: "all", icon: CheckSquare, highlight: false },
  ];

  return (
    <div className="space-y-6">
      {/* Informative Banner for Borrower Requests Awaiting Custodian Clearance */}
      {borrowerBookings.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 backdrop-blur-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    You have {borrowerBookings.length} reservation {borrowerBookings.length === 1 ? "request" : "requests"} awaiting custodian clearance
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Awaiting Custodian Review
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  As a researcher/borrower, your reservation for apparatus hosted by other labs requires authorization by that equipment&apos;s custodian before handover. You can inspect your submitted requests below or track clearance on your reservations dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeView !== "borrower" ? (
                <Link href="/approvals?view=borrower">
                  <Button variant="outline" size="sm" className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20">
                    <span>View Submitted Requests</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Link href="/bookings">
                  <Button variant="teal" size="sm">
                    <span>Open My Reservations</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Queue View Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link
          href="/approvals"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeView === "custodian"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Custodian Review Queue</span>
          {counts.pendingRequests > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
              {counts.pendingRequests}
            </span>
          )}
        </Link>

        <Link
          href="/approvals?view=borrower"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeView === "borrower"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>My Submitted Requests</span>
          {borrowerBookings.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-teal-500 text-slate-950">
              {borrowerBookings.length}
            </span>
          )}
        </Link>
      </div>

      {activeView === "borrower" ? (
        /* Borrower Outgoing Requests View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {borrowerBookings.length} {borrowerBookings.length === 1 ? "submitted request" : "submitted requests"} awaiting custodian review
            </span>
            <span className="italic">
              Equipment custodians and facility administrators review these requests
            </span>
          </div>

          {borrowerBookings.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="h-6 w-6 text-teal-600" />}
              title="No pending requests awaiting custodian review"
              description="You do not currently have any outgoing reservation requests waiting for custodian clearance. Explore available lab instruments and reserve apparatus anytime."
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/resources">
                    <Button variant="teal" size="sm">
                      <span>Browse Resource Catalog</span>
                    </Button>
                  </Link>
                  <Link href="/bookings">
                    <Button variant="outline" size="sm">
                      View My Reservations
                    </Button>
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {borrowerBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Custodian Managed Requests View */
        <div className="space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.value}
                  href={`/approvals${tab.value === "pending" ? "" : `?status=${tab.value}`}`}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm dark:bg-teal-700"
                      : tab.highlight && tab.highlightColor === "rose"
                      ? "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-950/60 dark:text-rose-300"
                      : tab.highlight
                      ? "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:bg-amber-950/60 dark:text-amber-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Approvals List or Empty State */}
          {bookings.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="h-6 w-6 text-teal-600" />}
              title={
                statusFilter === "pending"
                  ? "All caught up! No incoming requests pending authorization"
                  : statusFilter === "waitlist"
                  ? "Waitlist queue is empty"
                  : "No approval records found"
              }
              description={
                borrowerBookings.length > 0
                  ? `There are no incoming requests for apparatus you manage as a custodian. However, you have ${borrowerBookings.length} reservation request(s) you requested as a borrower awaiting custodian clearance.`
                  : statusFilter === "pending"
                  ? "There are currently no outstanding equipment reservations awaiting your custodian review. Incoming requests from researchers will populate here."
                  : `No requests matching "${statusFilter}" were found. Switch to the Pending tab or review your listed apparatus.`
              }
              action={
                <div className="flex flex-wrap items-center gap-3">
                  {borrowerBookings.length > 0 && (
                    <Link href="/approvals?view=borrower">
                      <Button variant="teal" size="sm">
                        <span>View Your {borrowerBookings.length} Submitted Requests</span>
                      </Button>
                    </Link>
                  )}
                  {statusFilter !== "pending" && (
                    <Link href="/approvals">
                      <Button variant="outline" size="sm">
                        View Pending Requests
                      </Button>
                    </Link>
                  )}
                  <Link href="/my-resources">
                    <Button variant="outline" size="sm">
                      <Layers className="h-4 w-4" />
                      <span>Manage Listed Resources</span>
                    </Button>
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {bookings.length} {bookings.length === 1 ? "request" : "requests"}
                </span>
                <span className="italic">
                  Authorizations enforce database exclusion constraints against overlapping active bookings
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {bookings.map((booking) => (
                  <ApprovalCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  return (
    <ContentContainer>
      <PageHeader
        title="Custodian Approval Queue"
        description="Verify researcher prerequisites, review project scopes, and authorize custody reservations for managed laboratory equipment."
        badge={<Badge variant="teal">Custodian Authorizations</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/bookings">
              <Button variant="outline" size="sm">
                <CalendarCheck className="h-4 w-4" />
                <span>My Reservations</span>
              </Button>
            </Link>
            <Link href="/my-resources/new">
              <Button variant="teal" size="sm">
                <PlusCircle className="h-4 w-4" />
                <span>List New Apparatus</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mt-8">
        <React.Suspense fallback={<LoadingState message="Loading custodian review queue..." />}>
          <ApprovalsContent searchParams={searchParams} />
        </React.Suspense>
      </div>
    </ContentContainer>
  );
}
