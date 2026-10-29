import * as React from "react";
import Link from "next/link";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { GlowingBadge } from "@/components/ui/glowing-badge";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { SpotlightCard } from "@/components/ui/spotlight-card";
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
  ArrowUpRight,
  Layers,
  Cpu,
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
      title: "Available Apparatus",
      value: publishedCount.toString(),
      status: publishedCount > 0 ? "Catalog Live" : "Awaiting Listings",
      description: "Instruments & labs ready for booking",
      icon: Boxes,
      badgeVariant: "teal" as const,
      pulse: publishedCount > 0,
      href: "/resources",
      glowColor: "rgba(20, 184, 166, 0.15)",
    },
    {
      title: "Pending Bookings",
      value: pendingBookingsCount.toString(),
      status: pendingBookingsCount > 0 ? "Under Review" : user ? "Queue Empty" : "Sign In to View",
      description: "Requests awaiting custodian review",
      icon: Clock,
      badgeVariant: (pendingBookingsCount > 0 ? "amber" : "neutral") as "amber" | "neutral",
      pulse: pendingBookingsCount > 0,
      href: "/bookings",
      glowColor: "rgba(245, 158, 11, 0.15)",
    },
    {
      title: "Active Reservations",
      value: activeLoansCount.toString(),
      status: activeLoansCount > 0 ? "In Custody" : "No Active Slots",
      description: "Approved or checked-out instruments",
      icon: Calendar,
      badgeVariant: (activeLoansCount > 0 ? "emerald" : "neutral") as "emerald" | "neutral",
      pulse: activeLoansCount > 0,
      href: "/bookings",
      glowColor: "rgba(16, 185, 129, 0.15)",
    },
    {
      title: "Approvals Needed",
      value: pendingApprovalsCount.toString(),
      status: pendingApprovalsCount > 0 ? "Action Required" : "Up to Date",
      description: "Incoming requests for your apparatus",
      icon: FileCheck,
      badgeVariant: (pendingApprovalsCount > 0 ? "rose" : "neutral") as "rose" | "neutral",
      pulse: pendingApprovalsCount > 0,
      href: "/approvals",
      glowColor: "rgba(244, 63, 94, 0.15)",
    },
  ];

  const categories = [
    "All Categories",
    "Analytical & Testing",
    "Fabrication & CNC",
    "Computing & Server Hardware",
    "Cleanrooms & Specialized Spaces",
    "Optics & Imaging",
    "Electronics & Embedded Kits",
  ];

  const trustWorkflow = [
    {
      step: "01",
      title: "Discover & Match",
      desc: "Cross-institutional catalog search with multi-factor TF-IDF AI capability scoring.",
      icon: Search,
      tag: "AI Powered",
    },
    {
      step: "02",
      title: "Verify Eligibility",
      desc: "Institutional department clearance and safety certifications confirmed automatically.",
      icon: ShieldCheck,
      tag: "RBAC Gated",
    },
    {
      step: "03",
      title: "Request Slot",
      desc: "Specify project purpose, required accessories, and reserved time slot with interval locks.",
      icon: ClipboardList,
      tag: "Conflict-Free",
    },
    {
      step: "04",
      title: "Owner Review",
      desc: "Facility custodian reviews researcher profile and authorizes physical custody transfer.",
      icon: CheckCircle2,
      tag: "Audited",
    },
    {
      step: "05",
      title: "Secure Check Out",
      desc: "Custody transfer initiated with baseline condition reporting and safety acknowledgement.",
      icon: ArrowRight,
      tag: "Condition Log",
    },
    {
      step: "06",
      title: "Audited Return",
      desc: "Inspect condition on return, document discrepancies, and log tamper-proof trail.",
      icon: RotateCcw,
      tag: "Deposit Hold",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner & Quick Context */}
      <PageHeader
        title="Institutional Resource Overview"
        description="Monitor equipment custody, review clearance workflows, and discover shared departmental tools."
        badge={
          <GlowingBadge variant="teal" pulse={true}>
            TechCircuit Consortium
          </GlowingBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/resources">
              <Button
                variant="primary"
                size="sm"
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-sm"
              >
                <Compass className="h-4 w-4 mr-1 text-cyan-200" />
                <span>Explore Directory</span>
              </Button>
            </Link>
            <Link href="/my-resources/new">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold"
              >
                <PlusCircle className="h-4 w-4 mr-1 text-slate-500" />
                <span>List Apparatus</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Section with Scientific Grid Background */}
      <BackgroundGrid className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        <div className="max-w-4xl mx-auto text-center space-y-4 py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            <span>Next-Generation Shared Scientific Infrastructure</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Trusted Institutional <span className="gradient-text-teal">Apparatus & Space Sharing</span>
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Nexus enables universities, colleges, laboratories, and makerspaces to share
            high-value equipment, computing clusters, and specialized testing facilities
            safely with verified clearances and immutable custody audits.
          </p>

          {/* Integrated Search Bar inside Hero */}
          <form
            action="/resources"
            method="GET"
            className="pt-2 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="query"
                placeholder="Search oscilloscopes, electron microscopes, SLA 3D printers, cleanrooms..."
                className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:placeholder:text-slate-500 shadow-sm"
                aria-label="Search resources"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="h-11 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold shadow-md px-6 cursor-pointer"
            >
              <span>Search Catalog</span>
              <ArrowUpRight className="h-4 w-4 ml-1 text-cyan-400" />
            </Button>
          </form>

          {/* Quick Category Chips */}
          <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap">
            {categories.slice(1, 5).map((category) => (
              <Link
                key={category}
                href={`/resources?category=${encodeURIComponent(category)}`}
                className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-2xs font-semibold text-slate-700 transition-all hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 shadow-2xs"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </BackgroundGrid>

      {/* 4-Pillar System Activity Bento Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Consortium Operational Activity
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
            {publishedCount} Apparatus Listed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link
                key={metric.title}
                href={metric.href}
                className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-2xl"
              >
                <SpotlightCard
                  spotlightColor={metric.glowColor}
                  className="p-5 h-full flex flex-col justify-between space-y-4 hover:border-cyan-500/40 dark:hover:border-cyan-400/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {metric.title}
                    </span>
                    <GlowingBadge variant={metric.badgeVariant} pulse={metric.pulse} className="text-[10px] py-0">
                      {metric.status}
                    </GlowingBadge>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                      {metric.value}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {metric.description}
                  </p>
                </SpotlightCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recommended / Recently Available Apparatus Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                Featured Research Apparatus
              </h3>
              <Badge variant="teal" className="text-2xs font-mono font-bold">
                Live Catalog
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Precision instruments shared across partner universities and makerspaces.
            </p>
          </div>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            <span>View Complete Catalog ({publishedCount})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentResources.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-6 sm:p-8 dark:border-slate-800/80 dark:from-slate-900/90 dark:to-slate-950/90 shadow-md">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>Governance Framework</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            How Nexus Ensures Safe Resource Custody
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every equipment transaction is governed by verifiable training clearance, custodian approval,
            and auditable condition logs to protect delicate scientific assets.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustWorkflow.map((item) => {
            const Icon = item.icon;
            return (
              <SpotlightCard
                key={item.step}
                className="p-5 flex flex-col justify-between space-y-3 border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950/60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {item.tag}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-slate-400 dark:text-slate-600">
                      {item.step}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </SpotlightCard>
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
