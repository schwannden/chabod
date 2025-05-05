
import { useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { useTenantRole } from "@/hooks/useTenantRole";
import { getServices } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { Service } from "@/lib/services";
import { CreateServiceDialog } from "@/components/Services/CreateServiceDialog";
import { ServiceCard } from "@/components/Services/ServiceCard";
import { useState } from "react";
import { EditServiceDialog } from "@/components/Services/EditServiceDialog";

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const { role } = useTenantRole(slug, user?.id);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug || ""),
    enabled: !!slug
  });

  const { data: services, isLoading: isServicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ["services", tenant?.id],
    queryFn: () => getServices(tenant?.id || ""),
    enabled: !!tenant?.id
  });

  const canManageServices = role === 'owner';
  const isLoading = isTenantLoading || isServicesLoading;

  const handleEditService = (service: Service) => {
    setEditingService(service);
  };

  return (
    <TenantPageLayout
      title="服事管理"
      description="創建和管理服事類型"
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      breadcrumbItems={[{ label: "服事管理" }]}
      isLoading={isLoading}
      action={canManageServices && tenant && (
        <CreateServiceDialog 
          tenantId={tenant.id} 
          onSuccess={refetchServices}
        />
      )}
    >
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">載入中...</p>
            </CardContent>
          </Card>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service: Service) => (
              <ServiceCard 
                key={service.id}
                service={service}
                onEdit={handleEditService}
                onDeleted={refetchServices}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">尚未創建任何服事類型。</p>
            </CardContent>
          </Card>
        )}
      </div>

      {editingService && (
        <EditServiceDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          onSuccess={refetchServices}
        />
      )}
    </TenantPageLayout>
  );
}
