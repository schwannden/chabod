import { useParams, useNavigate } from "react-router-dom";
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
import { useState, useEffect } from "react";
import { EditServiceDialog } from "@/components/Services/EditServiceDialog";
import { useTranslation } from "react-i18next";

export default function ServicePage() {
  const { t } = useTranslation(["services", "dashboard", "common"]);
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const { role } = useTenantRole(slug, user?.id);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Redirect to auth page if user is not authenticated
  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isSessionLoading, navigate, slug]);

  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug || ""),
    enabled: !!slug,
  });

  const {
    data: services,
    isLoading: isServicesLoading,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ["services", tenant?.id],
    queryFn: () => getServices(tenant?.id || ""),
    enabled: !!tenant?.id,
  });

  const canManageServices = role === "owner";
  const isLoading = isSessionLoading || isTenantLoading || isServicesLoading;

  const handleEditService = (service: Service) => {
    setEditingService(service);
  };

  return (
    <TenantPageLayout
      title={t("dashboard:serviceManagementTitle")}
      description={t("dashboard:serviceManagementDesc")}
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      breadcrumbItems={[{ label: t("dashboard:serviceManagementTitle") }]}
      isLoading={isLoading}
      action={
        canManageServices &&
        tenant && <CreateServiceDialog tenantId={tenant.id} onSuccess={refetchServices} />
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{t("common:loading")}</p>
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
              <p className="text-muted-foreground">{t("services:noServiceTypesYet")}</p>
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
