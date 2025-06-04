import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TenantMemberWithProfile } from "@/lib/types";
import { deleteTenantMember, updateTenantMember } from "@/lib/member-service";
import { updateUserProfile } from "@/lib/profile-service";
import { MemberRoleSelect } from "./MemberRoleSelect";
import { MemberTableActions } from "./MemberTableActions";
import { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

interface MemberTableProps {
  user: User;
  members: TenantMemberWithProfile[];
  currentUserId: string;
  isCurrentUserOwner: boolean;
  onMemberUpdated: () => void;
}

export function MemberTable({
  user,
  members,
  isCurrentUserOwner,
  onMemberUpdated,
}: MemberTableProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoadingMemberId(memberId);

    try {
      await updateTenantMember(memberId, newRole);

      toast({
        title: t("members.memberRoleUpdated"),
        description: t("members.memberRoleUpdatedSuccess"),
      });
      onMemberUpdated();
    } catch (error) {
      toast({
        title: t("members.memberUpdateError"),
        description: error?.message || t("members.unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setLoadingMemberId(memberId);

    try {
      await deleteTenantMember(memberId);
      toast({
        title: t("members.memberRemoved"),
        description: t("members.memberRemovedSuccess"),
      });
      onMemberUpdated();
    } catch (error) {
      toast({
        title: t("members.memberRemoveError"),
        description: error?.message || t("members.unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  const startEditing = (member: TenantMemberWithProfile) => {
    setEditingMemberId(member.id);
    setFirstName(member.profile?.first_name || "");
    setLastName(member.profile?.last_name || "");
  };

  const cancelEditing = () => {
    setEditingMemberId(null);
    setFirstName("");
    setLastName("");
  };

  const saveNameChanges = async (member: TenantMemberWithProfile) => {
    if (!member.profile) return;

    setLoadingMemberId(member.id);

    try {
      await updateUserProfile(member.profile.id, {
        first_name: firstName,
        last_name: lastName,
        full_name:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName
              ? firstName
              : lastName
                ? lastName
                : member.profile.full_name,
      });

      toast({
        title: t("members.memberUpdated"),
        description: t("members.memberUpdatedSuccess"),
      });

      setEditingMemberId(null);
      onMemberUpdated();
    } catch (error) {
      toast({
        title: t("members.memberUpdateError"),
        description: error?.message || t("members.unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  const sortedMembers = [...members].sort((a) => {
    return a.role === "owner" ? -1 : 1;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("members.name")}</TableHead>
            <TableHead>{t("members.firstName")}</TableHead>
            <TableHead>{t("members.lastName")}</TableHead>
            <TableHead>{t("members.email")}</TableHead>
            <TableHead>{t("members.role")}</TableHead>
            <TableHead>{t("members.joinedAt")}</TableHead>
            <TableHead className="text-right">{t("members.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                {t("members.noMembersFound")}
              </TableCell>
            </TableRow>
          )}

          {sortedMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.profile?.full_name}</TableCell>

              <TableCell>
                {editingMemberId === member.id ? (
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t("members.firstName")}
                    className="w-full max-w-[150px]"
                  />
                ) : (
                  member.profile?.first_name || "-"
                )}
              </TableCell>

              <TableCell>
                {editingMemberId === member.id ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("members.lastName")}
                      className="w-full max-w-[120px]"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveNameChanges(member)}
                      disabled={loadingMemberId === member.id}
                    >
                      {t("common.save")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={loadingMemberId === member.id}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                ) : (
                  member.profile?.last_name || "-"
                )}
              </TableCell>

              <TableCell>{member.profile?.email}</TableCell>

              <TableCell>
                <MemberRoleSelect
                  currentRole={member.role}
                  onRoleChange={(role) => handleRoleChange(member.id, role)}
                  disabled={!isCurrentUserOwner}
                />
              </TableCell>

              <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>

              <TableCell className="text-right">
                <MemberTableActions
                  isCurrentUserOwner={isCurrentUserOwner || member.user_id === user.id}
                  isEditing={editingMemberId === member.id}
                  isLoading={loadingMemberId === member.id}
                  onEditClick={() => startEditing(member)}
                  onDeleteClick={() => handleDeleteMember(member.id)}
                  memberName={member.profile?.full_name || ""}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
