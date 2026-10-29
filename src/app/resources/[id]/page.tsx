import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { getResourceById } from "@/features/resources/services/resource-service";
import { getCurrentUser } from "@/lib/supabase/auth";
import { MyResourceActions } from "@/features/resources/components/my-resource-actions";
import { BookingRequestForm } from "@/features/bookings/components/booking-request-form";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
  Layers,
  UserCheck,
} from "lucide-react";

interface ResourceDetailsPageProps {
  params: Promise<{ id: string }>;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function ResourceDetailsContent({ params }: ResourceDetailsPageProps) {
  const { id } = await params;
  const { user } = await getCurrentUser();
  const resource = await getResourceById(id, user?.id);

  if (!resource) {
    notFound();
  }

  const isOwner = user?.id === resource.owner_id;
  const images = Array.isArray(resource.images) ? (resource.images as string[]) : [];
  const primaryImage = images.length > 0 ? images[0] : null;

  // Format availability by day
  const availabilityByDay = (resource.availability || []).sort(
    (a, b) => a.day_of_week - b.day_of_week
  );

  return (
    <div className="space-y-6">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/resources"
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Apparatus Catalog</span>
        </Link>

        <div className="flex items-center gap-2">
          {resource.status === "published" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-700 border border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              Live Consortium Listing
            </span>
          ) : (
            <Badge variant="warning" className="uppercase text-[10px]">
              {resource.status}
            </Badge>
          )}

          {isOwner && (
            <Badge variant="navy" className="uppercase text-[10px]">
              Custodian View
            </Badge>
          )}
        </div>
      </div>

      {/* Owner Control Banner if viewing own resource */}
      {isOwner && (
        <div className="relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-slate-900/40 to-teal-500/5 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-teal-200">
                You are the custodian for this listing
              </p>
              <p className="text-[11px] text-slate-600 dark:text-teal-400/80">
                {resource.status === "published"
                  ? "Listing is live in the shared consortium catalog. Incoming booking requests will route to your approval queue."
                  : resource.status === "draft"
                  ? "This listing is in draft mode and hidden from public search."
                  : "This apparatus has been archived."}
              </p>
            </div>
          </div>

          <MyResourceActions
            resourceId={resource.id}
            currentStatus={resource.status}
          />
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Primary Specs & Details (2 Cols) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Main Visual Header */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-md dark:border-slate-800">
            {primaryImage ? (
              <div className="relative aspect-[16/10] w-full bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primaryImage}
                  alt={resource.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                  <span className="font-mono text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10">
                    Apparatus Record #{resource.id.slice(0, 8)}
                  </span>
                  <span className="font-semibold text-2xs px-2 py-0.5 rounded bg-teal-500/80 text-white backdrop-blur-xs">
                    Verified Calibration
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                <Layers className="h-16 w-16 stroke-[1.25] text-slate-600" />
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                  Apparatus Image Not Uploaded
                </span>
              </div>
            )}

            {/* Thumbnail Strip if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 bg-slate-900/90 border-t border-slate-800 overflow-x-auto">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-700 hover:border-teal-500 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`${resource.title} photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title and Identification */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                {resource.resource_type || "Equipment"}
              </span>
              <Badge variant="neutral">{resource.category}</Badge>
              {resource.institution && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-teal-500" />
                  <span>{resource.institution.name}</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {resource.title}
            </h1>

            {resource.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 shrink-0 text-teal-600" />
                <span>{resource.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/60 p-6 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Technical Specifications & Scope
            </h2>
            <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
              {resource.description || "No detailed description provided."}
            </div>
          </div>

          {/* Structured Recurring Availability Schedule */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/60 p-6 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  Custodian Weekly Operating Schedule
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recurring weekly access windows maintained by the resource custodian.
                </p>
              </div>
            </div>

            {availabilityByDay.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800">
                No recurring weekly hours have been configured for this apparatus yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                {availabilityByDay.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {DAYS_OF_WEEK[slot.day_of_week] || `Day ${slot.day_of_week}`}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      <span>
                        {slot.start_time.slice(0, 5)} &ndash; {slot.end_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-950 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/60">
              <Info className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
              <span>
                Operating windows specify custodian access. Individual reservation slots and
                conflict checks are verified authoritatively by the reservation engine at time of booking.
              </span>
            </div>
          </div>

          {/* Eligibility & Safety Protocols Bento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Eligibility */}
            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Eligibility & Training
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {resource.eligibility_requirements ||
                  "Open to all authorized institutional researchers and enrolled students with active consortium credentials."}
              </p>
            </div>

            {/* Usage Rules & Safety */}
            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Usage Rules & Protocols
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {resource.usage_rules ||
                  "Follow standard lab safety protocols. Custody logs must be signed during handoff and post-session condition inspection."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Custodian Info & Action Card (1 Col) */}
        <div className="space-y-6">
          {/* Live Booking Request Form */}
          <BookingRequestForm resource={resource} currentUserId={user?.id} />

          {/* Custodian Profile Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Apparatus Custodian
            </span>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 font-black text-sm text-white shadow-xs">
                {(resource.owner?.full_name || "Nexus Custodian")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {resource.owner?.full_name || "Designated Lab Manager"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="neutral" className="text-[10px]">
                    {resource.owner?.role || "Member"}
                  </Badge>
                  {resource.owner?.verification_status === "verified" && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Responsible for physical access authorization, apparatus orientation, and condition sign-off.
            </p>
          </div>

          {/* Institution Summary Card */}
          {resource.institution && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Host Campus / Institution
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-teal-600" />
                <span>{resource.institution.name}</span>
              </p>
              {resource.institution.location && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resource.institution.location}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResourceDetailsPage({ params }: ResourceDetailsPageProps) {
  return (
    <ContentContainer>
      <React.Suspense
        fallback={
          <div className="space-y-6">
            <PageHeader
              title="Resource Specifications"
              description="Loading verified apparatus specifications..."
              badge={<Badge variant="neutral">Loading</Badge>}
            />
            <LoadingState message="Resolving resource metadata and availability schedules..." />
          </div>
        }
      >
        <ResourceDetailsContent params={params} />
      </React.Suspense>
    </ContentContainer>
  );
}
