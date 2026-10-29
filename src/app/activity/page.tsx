import * as React from "react";
import { getActivityLogs } from "@/features/admin/services/admin-service";
import { ActivityDashboardView } from "@/features/audit/components/activity-dashboard-view";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ShieldCheck } from "lucide-react";

async function ActivityLogsContent() {
  const logs = await getActivityLogs({ limit: 100 });

  return <ActivityDashboardView initialLogs={logs} />;
}

export default function ActivityHistoryPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Consortium Activity & Audit Ledger"
        description="Tamper-evident operational ledger recording apparatus handovers, custodian clearances, return condition certifications, and institutional governance."
        breadcrumbs={[
          { label: "Consortium", href: "/" },
          { label: "Audited Ledger" },
        ]}
        badge={
          <Badge variant="violet" dot className="uppercase tracking-wider text-[11px]">
            Cryptographic Ledger
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-mono text-[11px]">Audit Engine Synchronized</span>
          </div>
        }
      />

      <div className="mt-8">
        <React.Suspense fallback={<LoadingState message="Querying institutional audit ledger..." />}>
          <ActivityLogsContent />
        </React.Suspense>
      </div>
    </ContentContainer>
  );
}
