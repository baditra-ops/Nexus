import * as React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getResourceById, getInstitutions } from "@/features/resources/services/resource-service";
import { ResourceForm } from "@/features/resources/components/resource-form";
import { ContentContainer } from "@/components/ui/content-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";

interface EditResourcePageProps {
  params: Promise<{ id: string }>;
}

async function EditResourceContent({ params }: EditResourcePageProps) {
  const { id } = await params;
  const { user } = await requireUser(`/auth/sign-in?redirectTo=/my-resources/${id}/edit`);

  const [resource, institutions] = await Promise.all([
    getResourceById(id, user.id),
    getInstitutions(),
  ]);

  if (!resource || resource.owner_id !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Apparatus: ${resource.title}`}
        description="Update asset specifications, operating windows, eligibility rules, and availability."
        breadcrumbs={[
          { label: "Custodian Portal", href: "/my-resources" },
          { label: "Assets", href: "/my-resources" },
          { label: resource.title },
        ]}
        badge={
          <Badge
            variant={resource.status === "published" ? "emerald" : "amber"}
            dot
            className="uppercase tracking-wider text-[11px]"
          >
            {resource.status}
          </Badge>
        }
      />

      <div className="mt-8 max-w-4xl mx-auto">
        <ResourceForm initialData={resource} institutions={institutions} />
      </div>
    </div>
  );
}

export default function EditResourcePage({ params }: EditResourcePageProps) {
  return (
    <ContentContainer size="default">
      <React.Suspense fallback={<LoadingState message="Loading resource specifications..." />}>
        <EditResourceContent params={params} />
      </React.Suspense>
    </ContentContainer>
  );
}
