import * as React from "react";
import { requireUser } from "@/lib/supabase/auth";
import { getInstitutions } from "@/features/resources/services/resource-service";
import { ResourceForm } from "@/features/resources/components/resource-form";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";

async function NewResourceContent() {
  await requireUser("/auth/sign-in?redirectTo=/my-resources/new");
  const institutions = await getInstitutions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register New Scientific Apparatus"
        description="Publish research equipment, fabrication tools, cleanrooms, or testing facilities to the institutional consortium."
        breadcrumbs={[
          { label: "Custodian Portal", href: "/my-resources" },
          { label: "Assets", href: "/my-resources" },
          { label: "Register New Asset" },
        ]}
        badge={
          <Badge variant="cyan" dot className="uppercase tracking-wider text-[11px]">
            New Instrument Onboarding
          </Badge>
        }
      />

      <div className="mt-8 max-w-4xl mx-auto">
        <ResourceForm institutions={institutions} />
      </div>
    </div>
  );
}

export default function NewResourcePage() {
  return (
    <ContentContainer size="default">
      <React.Suspense fallback={<LoadingState message="Initializing resource registration..." />}>
        <NewResourceContent />
      </React.Suspense>
    </ContentContainer>
  );
}
