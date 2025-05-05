import { ReactNode, useEffect, useState } from "react";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { useToast } from "@/components/ui/use-toast";
import { Tenant } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { getTenantBySlug } from "@/lib/tenant-utils";

interface GenericEventPageProps {
  // Page metadata
  slug: string;
  title: string;

  // Main components
  calendar: ReactNode;
  filterBar: ReactNode;
  listView: ReactNode;

  // Optional components
  actionButton?: ReactNode;
  dialog?: ReactNode;

  // Fetch functions
  fetchBaseData?: (tenantId: string) => Promise<void>;
}

export function GenericEventPage({
  slug,
  title,
  calendar,
  filterBar,
  listView,
  actionButton,
  dialog,
  fetchBaseData,
}: GenericEventPageProps) {
  const { isLoading } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      try {
        const tenantData = await getTenantBySlug(slug);
        setTenant(tenantData);
      } catch (error) {
        console.error("Error fetching tenant:", error);
        toast({
          title: "Error",
          description: "Failed to load tenant information.",
          variant: "destructive",
        });
      }
    };

    fetchTenant();
  }, [slug, toast]);

  useEffect(() => {
    if (tenant?.id && fetchBaseData) {
      fetchBaseData(tenant.id);
    }
  }, [tenant, fetchBaseData]);

  return (
    <TenantPageLayout
      title={title}
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      isLoading={isLoading}
      breadcrumbItems={[{ label: title }]}
      action={actionButton}
    >
      {/* Calendar View */}
      {calendar}

      {/* Filter Bar */}
      {filterBar}

      {/* List View */}
      {listView}

      {/* Dialog (if provided) */}
      {dialog}
    </TenantPageLayout>
  );
}
