import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getUserNotifications } from "@/features/bookings/services/booking-service";
import { NotificationsView } from "@/features/notifications/components/notifications-view";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { Bell } from "lucide-react";

async function NotificationsContent() {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?redirectTo=/notifications");
  }

  const notifications = await getUserNotifications(user.id);

  return <NotificationsView notifications={notifications} currentUserId={user.id} />;
}

export default function NotificationsPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Event Stream & Alerts"
        description="Real-time operational stream of equipment clearance requests, custody handovers, return condition certifications, and consortium notices."
        breadcrumbs={[
          { label: "Consortium", href: "/" },
          { label: "Event Stream" },
        ]}
        badge={
          <Badge variant="cyan" dot className="uppercase tracking-wider text-[11px]">
            Live Event Stream
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">Subscribed to WebSocket Feed</span>
          </div>
        }
      />

      <div className="mt-8">
        <React.Suspense fallback={<LoadingState message="Loading notifications..." />}>
          <NotificationsContent />
        </React.Suspense>
      </div>
    </ContentContainer>
  );
}
