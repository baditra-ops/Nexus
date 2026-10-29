import * as React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getMyBookings } from "@/features/bookings/services/booking-service";
import { BookingCard } from "@/features/bookings/components/booking-card";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { CalendarCheck, Compass, LogIn, Clock, CheckCircle2, History } from "lucide-react";

interface MyBookingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function MyBookingsContent({ searchParams }: MyBookingsPageProps) {
  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : "all";
  const { user } = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn className="h-6 w-6 text-teal-600" />}
        title="Sign in to view your reservations"
        description="Connect with your institutional credentials to monitor equipment booking requests, check clearance progress, and coordinate custody handoffs."
        action={
          <Link href="/auth/sign-in?redirectTo=/bookings">
            <Button variant="teal" size="sm">
              <span>Sign In</span>
            </Button>
          </Link>
        }
      />
    );
  }

  const bookings = await getMyBookings(user.id, statusFilter);

  const filterTabs = [
    { label: "All Reservations", value: "all", icon: CalendarCheck },
    { label: "Active Loans", value: "active", icon: CheckCircle2 },
    { label: "Overdue", value: "overdue", icon: Clock },
    { label: "Pending Review", value: "requested", icon: Clock },
    { label: "Approved Handover", value: "approved", icon: CheckCircle2 },
    { label: "Waitlisted", value: "waitlisted", icon: Clock },
    { label: "History & Past", value: "history", icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.value}
              href={`/bookings${tab.value === "all" ? "" : `?status=${tab.value}`}`}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bookings List or Empty State */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6 text-teal-600" />}
          title={
            statusFilter === "all"
              ? "No reservations found"
              : `No ${statusFilter} bookings found`
          }
          description={
            statusFilter === "all"
              ? "You do not have any pending or active equipment reservations. When you submit a booking request for lab instruments or workspace, it will appear here with clearance tracking."
              : `No bookings matching "${statusFilter}" were found. Try switching filter tabs or explore the directory to reserve new equipment.`
          }
          action={
            <div className="flex flex-wrap items-center gap-3">
              {statusFilter !== "all" && (
                <Link href="/bookings">
                  <Button variant="outline" size="sm">
                    View All Bookings
                  </Button>
                </Link>
              )}
              <Link href="/resources">
                <Button variant="teal" size="sm">
                  <Compass className="h-4 w-4" />
                  <span>Browse Available Catalog</span>
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Showing {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage({ searchParams }: MyBookingsPageProps) {
  return (
    <ContentContainer>
      <PageHeader
        title="Reservations & Custody Logs"
        description="Monitor status of your equipment reservations, review prerequisite clearance progress, and coordinate custody handovers."
        breadcrumbs={[
          { label: "Consortium", href: "/" },
          { label: "My Reservations" },
        ]}
        badge={
          <Badge variant="cyan" dot className="uppercase tracking-wider text-[11px]">
            Reservation Hub
          </Badge>
        }
        actions={
          <Link href="/resources">
            <Button variant="cyan" size="sm">
              <Compass className="h-4 w-4" />
              <span>Explore Apparatus</span>
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        <React.Suspense fallback={<LoadingState message="Loading your bookings..." />}>
          <MyBookingsContent searchParams={searchParams} />
        </React.Suspense>
      </div>
    </ContentContainer>
  );
}
