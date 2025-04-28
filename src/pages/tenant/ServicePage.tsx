
import { useParams } from "react-router-dom";
import { useSession } from "@/contexts/AuthContext";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { useTenantRole } from "@/hooks/useTenantRole";
import { getServices } from "@/lib/service-service";

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const { role } = useTenantRole(slug, user?.id);
  
  const { data: tenant } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug || ""),
    enabled: !!slug
  });

  const { data: services } = useQuery({
    queryKey: ["services", tenant?.id],
    queryFn: () => getServices(tenant?.id || ""),
    enabled: !!tenant?.id
  });

  const canManageServices = role === 'owner';

  return (
    <TenantPageLayout
      title="服事管理"
      description="創建和管理服事類型"
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      breadcrumbItems={[{ label: "服事管理" }]}
      isLoading={!tenant}
    >
      <div className="space-y-4">
        <div>
          {/* Service management content will go here */}
          <p className="text-muted-foreground">Content coming soon...</p>
        </div>
      </div>
    </TenantPageLayout>
  );
}
