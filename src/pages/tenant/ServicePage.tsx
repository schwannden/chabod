import { useParams } from "react-router-dom";
import { useSession } from "@/contexts/AuthContext";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { useTenantRole } from "@/hooks/useTenantRole";
import { getServices } from "@/lib/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/lib/services";

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const { role } = useTenantRole(slug, user?.id);
  
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug || ""),
    enabled: !!slug
  });

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["services", tenant?.id],
    queryFn: () => getServices(tenant?.id || ""),
    enabled: !!tenant?.id
  });

  const canManageServices = role === 'owner';
  const isLoading = isTenantLoading || isServicesLoading;

  return (
    <TenantPageLayout
      title="服事管理"
      description="創建和管理服事類型"
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      breadcrumbItems={[{ label: "服事管理" }]}
      isLoading={isLoading}
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
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>
                    {service.default_start_time && service.default_end_time ? 
                      `${service.default_start_time} - ${service.default_end_time}` : 
                      "未設定預設時間"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Future content can go here */}
                </CardContent>
              </Card>
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
    </TenantPageLayout>
  );
}
