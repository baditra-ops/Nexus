import * as React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getManagedApprovals, getCustodianActionCounts } from "@/features/bookings/services/booking-service";
import { ApprovalCard } from "@/features/bookings/components/approval-card";
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
} from "lucide-react";

interface ApprovalsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ApprovalsContent({ searchParams }: ApprovalsPageProps) {
  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : "pending";
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

  const [bookings, counts] = await Promise.all([
    getManagedApprovals(user.id, statusFilter),
    getCustodianActionCounts(user.id),
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
              ? "All caught up! No requests pending authorization"
              : statusFilter === "waitlist"
              ? "Waitlist queue is empty"
              : "No approval records found"
          }
          description={
            statusFilter === "pending"
              ? "There are currently no outstanding equipment reservations awaiting your custodian review. Incoming requests from researchers will populate here."
              : `No requests matching "${statusFilter}" were found. Switch to the Pending tab or review your listed apparatus.`
          }
          action={
            <div className="flex flex-wrap items-center gap-3">
              {statusFilter !== "pending" && (
                <Link href="/approvals">
                  <Button variant="outline" size="sm">
                    View Pending Requests
                  </Button>
                </Link>
              )}
              <Link href="/my-resources">
                <Button variant="teal" size="sm">
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
          <Link href="/my-resources/new">
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span>List New Apparatus</span>
            </Button>
          </Link>
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
