import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useTenantRole } from "@/hooks/useTenantRole";
import { Button } from "@/components/ui/button";
import { getTenantBySlug } from "@/lib/tenant-service";
import { getTenantMembers } from "@/lib/member-service";
import { MemberTable } from "@/components/Members/MemberTable";
import { MemberInviteDialog } from "@/components/Members/MemberInviteDialog";
import { MemberFilterBar } from "@/components/Members/MemberFilterBar";
import { Tenant, TenantMemberWithProfile } from "@/lib/types";
import { UserPlus } from "lucide-react";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { useTranslation } from "react-i18next";

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role, isLoading: isRoleLoading } = useTenantRole(slug, user?.id);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const isOwner = role === "owner";

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isLoading, navigate, slug]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !user) return;

      try {
        const tenantData = await getTenantBySlug(slug);
        if (!tenantData) {
          navigate("/not-found");
          return;
        }
        setTenant(tenantData);

        const membersData = await getTenantMembers(tenantData.id);
        setMembers(membersData);

        const currentUserMember = membersData.find((m) => m.user_id === user.id);
        if (!currentUserMember) {
          navigate(`/tenant/${slug}`);
          return;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [slug, user, navigate]);

  const handleMemberUpdated = async () => {
    if (!tenant) return;
    setIsDataLoading(true);
    const membersData = await getTenantMembers(tenant.id);
    setMembers(membersData);
    setIsDataLoading(false);
  };

  const filteredMembers = members.filter((member) => {
    const nameMatch =
      !nameFilter ||
      (member.profile?.full_name || "").toLowerCase().includes(nameFilter.toLowerCase());

    const emailMatch =
      !emailFilter ||
      (member.profile?.email || "").toLowerCase().includes(emailFilter.toLowerCase());

    const roleMatch = roleFilter === "all" || member.role === roleFilter;

    return nameMatch && emailMatch && roleMatch;
  });

  if (isLoading || isDataLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">{t("common:loading")}</div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{t("common:tenantNotFound")}</h1>
            <p className="mb-6">{t("common:tenantNotFoundDesc", { slug })}</p>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">
              {t("common:returnHome")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <TenantPageLayout
      title={t("members:membersTitle")}
      description={t("members:membersDesc")}
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      isLoading={isLoading || isDataLoading || isRoleLoading}
      breadcrumbItems={[{ label: t("nav:members") }]}
      action={
        isOwner && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> {t("members:inviteMember")}
          </Button>
        )
      }
    >
      <MemberFilterBar
        searchName={nameFilter}
        setSearchName={setNameFilter}
        searchEmail={emailFilter}
        setSearchEmail={setEmailFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      <MemberTable
        user={user}
        members={filteredMembers}
        currentUserId={user?.id || ""}
        isCurrentUserOwner={isOwner}
        onMemberUpdated={handleMemberUpdated}
      />

      {tenant && (
        <MemberInviteDialog
          tenantSlug={slug || ""}
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          onInviteSuccess={handleMemberUpdated}
        />
      )}
    </TenantPageLayout>
  );
}
