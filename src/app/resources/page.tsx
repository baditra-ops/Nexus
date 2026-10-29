import * as React from "react";
import Link from "next/link";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { GlowingBadge } from "@/components/ui/glowing-badge";
import { ResourceCard } from "@/features/resources/components/resource-card";
import { ResourceFilters } from "@/features/resources/components/resource-filters";
import {
  getResources,
  getInstitutions,
} from "@/features/resources/services/resource-service";
import type { ResourceSortOption, DbResourceType } from "@/features/resources/types";
import { Compass, PlusCircle, ChevronLeft, ChevronRight, Sparkles, Filter } from "lucide-react";
import { AIRecommendationPanel } from "@/features/ai/components/ai-recommendation-panel";

interface ResourcesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ResourcesDirectoryContent({ searchParams }: ResourcesPageProps) {
  const params = await searchParams;

  const query = typeof params.query === "string" ? params.query : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const rawType = typeof params.resourceType === "string" ? params.resourceType : undefined;
  const resourceType =
    rawType && rawType !== "all" ? (rawType as DbResourceType) : undefined;
  const institutionId =
    typeof params.institutionId === "string" ? params.institutionId : undefined;
  const sort =
    typeof params.sort === "string"
      ? (params.sort as ResourceSortOption)
      : "newest";
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;
  const limit = 12;

  const [{ resources, totalCount }, institutions] = await Promise.all([
    getResources({
      query,
      category,
      resourceType,
      institutionId,
      sort,
      page,
      limit,
    }),
    getInstitutions(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Helper to build pagination links
  const createPageUrl = (targetPage: number) => {
    const qp = new URLSearchParams();
    if (query) qp.set("query", query);
    if (category && category !== "All") qp.set("category", category);
    if (resourceType) qp.set("resourceType", resourceType);
    if (institutionId && institutionId !== "all") qp.set("institutionId", institutionId);
    if (sort && sort !== "newest") qp.set("sort", sort);
    if (targetPage > 1) qp.set("page", targetPage.toString());
    const str = qp.toString();
    return `/resources${str ? `?${str}` : ""}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Discover Shared Apparatus"
        description="Search, filter, and inspect verified institutional equipment, cleanrooms, and testing facilities available across the consortium."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Resources" },
        ]}
        badge={
          <GlowingBadge variant="teal" pulse={totalCount > 0}>
            {totalCount} {totalCount === 1 ? "Instrument" : "Instruments"} Live
          </GlowingBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <AIRecommendationPanel />
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

      {/* Filter Bar */}
      <React.Suspense fallback={<div className="h-28 rounded-2xl bg-slate-100 animate-pulse dark:bg-slate-800" />}>
        <ResourceFilters institutions={institutions} />
      </React.Suspense>

      {/* Catalog Grid or Empty State */}
      {resources.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Compass className="h-8 w-8 text-cyan-600" />}
            title="No matching apparatus found"
            description={
              query || category || resourceType || institutionId
                ? "No published listings match your current search terms or filter selection. Try adjusting your search query or clearing filters."
                : "No verified resources have been published yet in the consortium directory. Be the first department to list an instrument or research space."
            }
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/resources">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Clear Filters
                  </Button>
                </Link>
                <Link href="/my-resources/new">
                  <Button variant="teal" size="sm" className="rounded-xl">
                    <PlusCircle className="h-4 w-4" />
                    <span>List New Apparatus</span>
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-700 dark:text-slate-300">
              <Filter className="h-3.5 w-3.5 text-cyan-500" />
              Showing {resources.length} of {totalCount} Instruments
            </span>
            {totalPages > 1 && (
              <span>
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {page > 1 ? (
                <Link href={createPageUrl(page - 1)}>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled className="rounded-xl">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
              )}

              <span className="px-3 text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link href={createPageUrl(page + 1)}>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled className="rounded-xl">
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DiscoverResourcesPage({ searchParams }: ResourcesPageProps) {
  return (
    <ContentContainer>
      <React.Suspense
        fallback={
          <div className="space-y-6">
            <PageHeader
              title="Discover Shared Apparatus"
              description="Loading institutional catalog..."
              badge={<Badge variant="neutral">Loading</Badge>}
            />
            <LoadingState message="Fetching available instruments and spaces..." />
          </div>
        }
      >
        <ResourcesDirectoryContent searchParams={searchParams} />
      </React.Suspense>
    </ContentContainer>
  );
}
