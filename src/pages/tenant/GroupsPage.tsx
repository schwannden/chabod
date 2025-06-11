import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useTenantRole } from "@/hooks/useTenantRole";
import { GroupTable } from "@/components/Groups/GroupTable";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { getTenantGroups } from "@/lib/group-service";
import { Tenant, GroupWithMemberCount } from "@/lib/types";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function GroupsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role, isLoading: isRoleLoading } = useTenantRole(slug, user?.id);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isTenantOwner = role === "owner";

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isSessionLoading, navigate, slug]);

  useEffect(() => {
    const fetchTenantAndGroups = async () => {
      if (!slug || !user) return;

      try {
        const tenantData = await getTenantBySlug(slug);
        if (!tenantData) {
          navigate("/not-found");
          return;
        }
        setTenant(tenantData);

        const groupsData = await getTenantGroups(tenantData.id);
        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching tenant or groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTenantAndGroups();
    }
  }, [slug, user, navigate]);

  const handleGroupCreated = async () => {
    if (tenant) {
      const updatedGroups = await getTenantGroups(tenant.id);
      setGroups(updatedGroups);
    }
  };

  const handleGroupUpdated = handleGroupCreated;
  const handleGroupDeleted = handleGroupCreated;

  if (isSessionLoading || isLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t("common:loading")}</span>
      </div>
    );
  }

  return (
    <TenantPageLayout
      title={t("groups:manageGroups")}
      description={t("groups:manageGroupsDescription", { tenantName: tenant?.name || "" })}
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      isLoading={isLoading || isRoleLoading}
      breadcrumbItems={[{ label: t("groups:groups") }]}
    >
      {tenant && (
        <GroupTable
          groups={groups}
          tenantId={tenant.id}
          isTenantOwner={isTenantOwner}
          onGroupCreated={handleGroupCreated}
          onGroupUpdated={handleGroupUpdated}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
    </TenantPageLayout>
  );
}
