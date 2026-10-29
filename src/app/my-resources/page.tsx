import * as React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getMyResources } from "@/features/resources/services/resource-service";
import { MyResourceActions } from "@/features/resources/components/my-resource-actions";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import {
  Boxes,
  PlusCircle,
  Building2,
  MapPin,
  Clock,
  LogIn,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowUpRight,
} from "lucide-react";

const CATEGORY_COLOR_MAP: Record<string, "amber" | "violet" | "cyan" | "emerald" | "rose" | "teal" | "neutral"> = {
  "Analytical & Testing": "cyan",
  "Fabrication & CNC": "amber",
  "Computing & Server Hardware": "rose",
  "Cleanrooms & Specialized Spaces": "cyan",
  "Optics & Imaging": "teal",
  "Electronics & Embedded Kits": "violet",
  "Biochemical & Life Sciences": "emerald",
  "Other": "neutral",
};

async function MyResourcesContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const { user } = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn className="h-6 w-6 text-cyan-400" />}
        title="Sign in to access Custodian Portal"
        description="You must be signed in with your institutional credentials to list laboratory apparatus, configure operating hours, and manage custody handovers."
        action={
          <Link href="/auth/sign-in?redirectTo=/my-resources">
            <Button variant="cyan" size="md">
              <LogIn className="h-4 w-4" />
              <span>Sign In to Account</span>
            </Button>
          </Link>
        }
      />
    );
  }

  const resources = await getMyResources(user.id);

  const publishedCount = resources.filter((r) => r.status === "published").length;
  const draftCount = resources.filter((r) => r.status === "draft").length;
  const archivedCount = resources.filter((r) => r.status === "archived").length;

  const filteredResources =
    statusFilter && statusFilter !== "all"
      ? resources.filter((r) => r.status === statusFilter)
      : resources;

  return (
    <div className="space-y-6">
      {/* Bento Telemetry Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Listings */}
        <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 shadow-[0_0_20px_rgba(139,92,246,0.12)] backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
              Total Assets
            </span>
            <Boxes className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">
            {resources.length}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-violet-400/80">
            <span>In Custodian Catalog</span>
          </div>
        </div>

        {/* Published */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-[0_0_20px_rgba(16,185,129,0.12)] backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Live & Booking
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">
            {publishedCount}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Discoverable on network</span>
          </div>
        </div>

        {/* Drafts */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-[0_0_20px_rgba(245,158,11,0.12)] backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Draft Staging
            </span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">
            {draftCount}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400/80">
            <span>Pending publication</span>
          </div>
        </div>

        {/* Archived */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4 shadow-sm backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Archived / Inactive
            </span>
            <Archive className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-300 font-mono">
            {archivedCount}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Removed from discoverability</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {[
          { label: "All Assets", value: "all", count: resources.length },
          { label: "Published", value: "published", count: publishedCount },
          { label: "Drafts", value: "draft", count: draftCount },
          { label: "Archived", value: "archived", count: archivedCount },
        ].map((tab) => {
          const isActive = (!statusFilter && tab.value === "all") || statusFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/my-resources" : `/my-resources?status=${tab.value}`}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-slate-900/60 text-slate-400 border border-white/5 hover:border-white/15 hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                isActive ? "bg-cyan-400/20 text-cyan-200" : "bg-white/10 text-slate-400"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Listings or Empty State */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-6 w-6 text-slate-500" />}
          title="No resources found in this view"
          description={
            statusFilter
              ? `You do not have any items currently marked as "${statusFilter}".`
              : "You have not registered any equipment or workspaces under your custodian profile yet."
          }
          action={
            <Link href="/my-resources/new">
              <Button variant="cyan" size="sm">
                <PlusCircle className="h-4 w-4" />
                <span>Register First Resource</span>
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filteredResources.map((res) => {
            const availabilityCount = res.availability?.length || 0;
            const images = Array.isArray(res.images) ? (res.images as string[]) : [];
            const catBadge = CATEGORY_COLOR_MAP[res.category] || "neutral";

            return (
              <Card
                key={res.id}
                className="overflow-hidden border-white/10 bg-slate-900/80 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    {images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={images[0]}
                        alt={res.title}
                        className="h-20 w-20 rounded-xl object-cover shrink-0 border border-white/15 shadow-md"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-950/80 border border-white/10 text-slate-500">
                        <Boxes className="h-9 w-9 stroke-[1.2]" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/my-resources/${res.id}/edit`}
                          className="text-base font-extrabold text-white hover:text-cyan-400 transition-colors"
                        >
                          {res.title}
                        </Link>
                        <Badge
                          variant={
                            res.status === "published"
                              ? "emerald"
                              : res.status === "draft"
                              ? "amber"
                              : "neutral"
                          }
                          dot
                          className="capitalize text-[10px]"
                        >
                          {res.status}
                        </Badge>
                        <Badge variant={catBadge} className="text-[10px]">
                          {res.category}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="font-mono text-slate-300 uppercase text-[11px]">
                          {res.resource_type || "Equipment"}
                        </span>
                        {res.institution && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{res.institution.name}</span>
                          </div>
                        )}
                        {res.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{res.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-violet-300">
                          <Clock className="h-3 w-3 text-violet-400" />
                          <span>{availabilityCount} availability window(s)</span>
                        </div>
                        {res.deposit_amount > 0 && (
                          <div className="flex items-center gap-0.5 font-mono text-[11px] text-emerald-300">
                            <DollarSign className="h-3 w-3 text-emerald-400" />
                            <span>${Number(res.deposit_amount).toFixed(0)} escrow deposit</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="sm:self-center shrink-0">
                    <MyResourceActions resourceId={res.id} currentStatus={res.status} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <ContentContainer>
      <PageHeader
        title="Custodian Asset Control"
        description="Manage laboratory apparatus, configure operating windows, and monitor custody handovers across your department."
        badge={
          <Badge variant="cyan" dot className="uppercase tracking-wider text-[11px]">
            Custodian Operations
          </Badge>
        }
        actions={
          <Link href="/my-resources/new">
            <Button variant="cyan" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span>Register New Asset</span>
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        <React.Suspense
          fallback={
            <div className="p-12 text-center text-sm text-slate-500 font-mono">
              Synchronizing custodian catalog...
            </div>
          }
        >
          <MyResourcesContent searchParams={searchParams} />
        </React.Suspense>
      </div>
    </ContentContainer>
  );
}
