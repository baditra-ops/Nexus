import * as React from "react";
import Link from "next/link";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ResourceCard } from "@/features/resources/components/resource-card";
import {
  getResources,
  getPublishedResourceCount,
} from "@/features/resources/services/resource-service";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getPendingApprovalsCount } from "@/features/bookings/services/booking-service";
import {
  Search,
  PlusCircle,
  Calendar,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Boxes,
  FileCheck,
  ClipboardList,
  RotateCcw,
  Sparkles,
} from "lucide-react";

async function OverviewContent() {
  const { user } = await getCurrentUser();

  const [{ resources: recentResources }, publishedCount, pendingApprovalsCount, pendingBookingsCount, activeLoansCount] =
    await Promise.all([
      getResources({ limit: 4, sort: "newest" }),
      getPublishedResourceCount(),
      user ? getPendingApprovalsCount(user.id) : Promise.resolve(0),
      user
        ? (async () => {
            const supabase = await createClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST count query
            const { count } = await (supabase.from("bookings") as any)
              .select("id", { count: "exact", head: true })
              .eq("borrower_id", user.id)
              .eq("status", "requested");
            return count || 0;
          })()
        : Promise.resolve(0),
      user
        ? (async () => {
            const supabase = await createClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST count query
            const { count } = await (supabase.from("bookings") as any)
              .select("id", { count: "exact", head: true })
              .eq("borrower_id", user.id)
              .in("status", ["approved", "checked_out"]);
            return count || 0;
          })()
        : Promise.resolve(0),
    ]);

  const summaryMetrics = [
    {
      title: "Available Resources",
      value: publishedCount.toString(),
      status: publishedCount > 0 ? "Catalog Active" : "Awaiting Listings",
      description: "Apparatus & spaces ready for booking",
      icon: Boxes,
      badgeVariant: (publishedCount > 0 ? "teal" : "neutral") as "teal" | "neutral",
      href: "/resources",
    },
    {
      title: "Pending Bookings",
      value: pendingBookingsCount.toString(),
      status: pendingBookingsCount > 0 ? "Under Review" : user ? "Queue Empty" : "Sign In to View",
      description: "Requests awaiting custodian review",
      icon: Clock,
      badgeVariant: (pendingBookingsCount > 0 ? "warning" : "neutral") as "warning" | "neutral",
      href: "/bookings",
    },
    {
      title: "Active Reservations",
      value: activeLoansCount.toString(),
      status: activeLoansCount > 0 ? "Active Custody" : "No Active Slots",
      description: "Approved or checked-out apparatus",
      icon: Calendar,
      badgeVariant: (activeLoansCount > 0 ? "teal" : "neutral") as "teal" | "neutral",
      href: "/bookings",
    },
    {
      title: "Approvals Needed",
      value: pendingApprovalsCount.toString(),
      status: pendingApprovalsCount > 0 ? "Action Required" : "Up to Date",
      description: "Incoming requests for your apparatus",
      icon: FileCheck,
      badgeVariant: (pendingApprovalsCount > 0 ? "warning" : "neutral") as "warning" | "neutral",
      href: "/approvals",
    },
  ];

  const categories = [
    "All Categories",
    "Analytical & Testing",
    "Fabrication & CNC",
    "Computing & Server Hardware",
    "Cleanrooms & Specialized Spaces",
    "Optics & Imaging",
  ];

  const trustWorkflow = [
    {
      step: "01",
      title: "Discover",
      desc: "Search cross-institutional catalogs with real-time specs and availability.",
      icon: Search,
    },
    {
      step: "02",
      title: "Verify Eligibility",
      desc: "Ensure departmental clearances and safety certifications are confirmed.",
      icon: ShieldCheck,
    },
    {
      step: "03",
      title: "Request Booking",
      desc: "Specify project purpose, required accessories, and reserved time slots.",
      icon: ClipboardList,
    },
    {
      step: "04",
      title: "Owner Approval",
      desc: "Lab manager reviews researcher profile and authorizes access.",
      icon: CheckCircle2,
    },
    {
      step: "05",
      title: "Secure Check Out",
      desc: "Custody transfer initiated with baseline condition recording.",
      icon: ArrowRight,
    },
    {
      step: "06",
      title: "Audited Return",
      desc: "Inspect condition on return, document issues, and log immutable trail.",
      icon: RotateCcw,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Institutional Resource Overview"
        description="Monitor equipment custody, review clearance workflows, and discover shared departmental tools."
        badge={<Badge variant="teal">TechCircuit Network</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/resources">
              <Button variant="teal" size="sm">
                <Compass className="h-4 w-4" />
                <span>Explore Directory</span>
              </Button>
            </Link>
            <Link href="/my-resources/new">
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4" />
                <span>List a Resource</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Welcome & Mission Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Welcome to Nexus
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Trusted Institutional Equipment & Space Sharing
            </h2>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Nexus enables universities, colleges, laboratories, and makerspaces to share
              underutilized equipment, computing clusters, and specialized testing facilities
              safely. Every transaction is governed by eligibility verification, custodian approval,
              and auditable condition logs.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Institutional Consortium
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                TechCircuit Network
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-xs text-white dark:bg-slate-700">
              NX
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            System Activity Summary
          </h2>
          <span className="text-xs text-slate-400">
            {publishedCount} published resources indexed
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link
                key={metric.title}
                href={metric.href}
                className="block transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-xl"
              >
                <Card className="relative overflow-hidden transition-colors hover:border-teal-400 dark:hover:border-teal-600">
                  <CardHeader className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {metric.title}
                      </span>
                      <Badge variant={metric.badgeVariant} className="text-[10px]">
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        {metric.value}
                      </span>
                      <Icon className="ml-auto h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <CardDescription className="mt-1 text-xs">
                      {metric.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Prominent Discovery Search Area */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Discover Scientific Equipment & Workspaces
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Search cross-institutional listings or select an apparatus category to check availability.
          </p>
        </div>

        {/* Search Bar */}
        <form
          action="/resources"
          method="GET"
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="query"
              placeholder="Search oscilloscopes, electron microscopes, laser cutters, cleanrooms..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              aria-label="Search resources"
            />
          </div>
          <Button type="submit" variant="teal" size="md">
            <span>Search Catalog</span>
          </Button>
        </form>

        {/* Category Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/resources?category=${encodeURIComponent(category)}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended / Recently Available Section */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Recently Available Resources
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified equipment shared by participating member colleges and makerspaces.
            </p>
          </div>
          <Link
            href="/resources"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400"
          >
            View all &rarr;
          </Link>
        </div>

        {recentResources.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Boxes className="h-6 w-6 text-slate-500" />}
            title="No live resource listings yet"
            description="The catalog database is initialized. Verified lab equipment and shared spaces will display here once resources are registered and published."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/resources">
                  <Button variant="teal" size="sm">
                    <span>Open Resource Directory</span>
                  </Button>
                </Link>
                <Link href="/my-resources/new">
                  <Button variant="outline" size="sm">
                    <span>List First Resource</span>
                  </Button>
                </Link>
              </div>
            }
          />
        )}
      </div>

      {/* Trust & Custody Lifecycle Workflow */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="max-w-2xl">
          <Badge variant="teal" className="mb-2">
            Governance Framework
          </Badge>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            How Nexus Ensures Safe Resource Custody
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Unlike informal borrowing, every booking follows a structured multi-step verification
            trail to protect delicate and high-value research assets.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustWorkflow.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-lg border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-600">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <ContentContainer>
      <React.Suspense
        fallback={
          <div className="space-y-6">
            <PageHeader
              title="Institutional Resource Overview"
              description="Loading dashboard metrics..."
              badge={<Badge variant="teal">TechCircuit Network</Badge>}
            />
            <LoadingState message="Connecting to consortium catalog..." />
          </div>
        }
      >
        <OverviewContent />
      </React.Suspense>
    </ContentContainer>
  );
}
