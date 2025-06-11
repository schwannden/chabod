import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useTenantRole } from "@/hooks/useTenantRole";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tenant, Profile, GroupMemberWithProfile } from "@/lib/types";
import { getTenantBySlug, getTenantMembers } from "@/lib/tenant-utils";
import { addUserToGroup, getGroupMembers, removeUserFromGroup } from "@/lib/group-service";
import { supabase } from "@/integrations/supabase/client";
import { UserMinus } from "lucide-react";
import { TenantBreadcrumb } from "@/components/Layout/TenantBreadcrumb";
import { NavBar } from "@/components/Layout/NavBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export default function GroupMembersPage() {
  const { slug, groupId } = useParams<{ slug: string; groupId: string }>();
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { role, isLoading: isRoleLoading } = useTenantRole(slug, user?.id);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTenantOwner = role === "owner";

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isSessionLoading, navigate, slug]);

  useEffect(() => {
    const fetchDataAndCheckAccess = async () => {
      if (!slug || !user || !groupId) return;

      try {
        const tenantData = await getTenantBySlug(slug);
        if (!tenantData) {
          navigate("/not-found");
          return;
        }
        setTenant(tenantData);

        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (groupError || !groupData) {
          console.error("Error fetching group:", groupError);
          navigate(`/tenant/${slug}`);
          return;
        }

        setGroupName(groupData.name);

        const groupMembers = await getGroupMembers(groupId);
        setMembers(groupMembers);

        const tenantMembers = await getTenantMembers(tenantData.id);
        const existingMemberIds = new Set(groupMembers.map((m) => m.user_id));

        const availableProfiles = tenantMembers
          .filter((tm) => !existingMemberIds.has(tm.profile.id))
          .map((tm) => tm.profile);

        setAvailableMembers(availableProfiles);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: t("common:error"),
          description: t("groups:failedToLoadMembers"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDataAndCheckAccess();
    }
  }, [slug, groupId, user, navigate, toast, t]);

  const handleAddMember = async () => {
    if (!selectedUserId || !groupId) return;

    setIsSubmitting(true);
    try {
      await addUserToGroup(groupId, selectedUserId);
      toast({
        title: t("common:success"),
        description: t("groups:memberAdded"),
      });

      const updatedMembers = await getGroupMembers(groupId);
      setMembers(updatedMembers);

      const existingMemberIds = new Set(updatedMembers.map((m) => m.user_id));
      setAvailableMembers((prev) => prev.filter((profile) => !existingMemberIds.has(profile.id)));

      setIsAddMemberOpen(false);
      setSelectedUserId("");
    } catch (error) {
      console.error("Failed to add member:", error);
      toast({
        title: t("common:error"),
        description: t("groups:failedToAddMember"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setIsSubmitting(true);
    try {
      await removeUserFromGroup(memberId);
      toast({
        title: t("common:success"),
        description: t("groups:memberRemoved"),
      });

      const updatedMembers = await getGroupMembers(groupId!);
      setMembers(updatedMembers);

      if (tenant) {
        const tenantMembers = await getTenantMembers(tenant.id);
        const existingMemberIds = new Set(updatedMembers.map((m) => m.user_id));
        const availableProfiles = tenantMembers
          .filter((tm) => !existingMemberIds.has(tm.profile.id))
          .map((tm) => tm.profile);
        setAvailableMembers(availableProfiles);
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast({
        title: t("common:error"),
        description: t("groups:failedToRemoveMember"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading || isLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">{t("common:loading")}</div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {tenant && (
          <div className="mb-6 space-y-6">
            <TenantBreadcrumb
              tenantName={tenant.name}
              tenantSlug={tenant.slug}
              items={[
                {
                  label: t("groups:groups"),
                  path: `/tenant/${tenant.slug}/groups`,
                },
                {
                  label: t("groups:members"),
                },
              ]}
            />

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">{t("groups:groupMembers", { groupName })}</h1>
                <p className="text-muted-foreground">{t("groups:manageMembersDescription")}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate(`/tenant/${slug}/groups`)}>
                  {t("groups:backToGroups")}
                </Button>

                {isTenantOwner && (
                  <Button
                    onClick={() => setIsAddMemberOpen(true)}
                    disabled={availableMembers.length === 0}
                  >
                    {t("groups:addMember")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("groups:noMembersInGroup")}{" "}
            {isTenantOwner && availableMembers.length > 0 && t("groups:addMembersToGetStarted")}
            {isTenantOwner && availableMembers.length === 0 && t("groups:allMembersAlreadyInGroup")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("groups:name")}</TableHead>
                <TableHead>{t("groups:email")}</TableHead>
                <TableHead>{t("groups:addedOn")}</TableHead>
                {isTenantOwner && (
                  <TableHead className="text-right">{t("groups:actions")}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.profile?.full_name || t("groups:unknown")}
                  </TableCell>
                  <TableCell>{member.profile?.email || t("groups:noEmail")}</TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  {isTenantOwner && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isSubmitting}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        {t("groups:remove")}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("groups:addMemberToGroup")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableMembers.length === 0 ? (
                <p>{t("groups:allMembersAlreadyInGroup")}</p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="member-select">{t("groups:selectMember")}</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="member-select">
                      <SelectValue placeholder={t("groups:selectMemberPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                {t("common:cancel")}
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={isSubmitting || !selectedUserId || availableMembers.length === 0}
              >
                {isSubmitting ? t("groups:adding") : t("groups:addToGroup")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
