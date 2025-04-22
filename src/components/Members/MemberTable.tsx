import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { TenantMemberWithProfile } from "@/lib/types";
import { deleteTenantMember, updateTenantMember } from "@/lib/member-service";
import { updateUserProfile } from "@/lib/profile-service";
import { MemberNameEditor } from "./MemberNameEditor";
import { MemberRoleSelect } from "./MemberRoleSelect";
import { MemberTableActions } from "./MemberTableActions";

interface MemberTableProps {
  members: TenantMemberWithProfile[];
  currentUserId: string;
  isCurrentUserOwner: boolean;
  onMemberUpdated: () => void;
}

export function MemberTable({ 
  members, 
  currentUserId, 
  isCurrentUserOwner, 
  onMemberUpdated 
}: MemberTableProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const { toast } = useToast();

  const getRoleValue = (displayRole: string): string => {
    if (displayRole === "管理者") return "owner";
    if (displayRole === "一般會友") return "member";
    return displayRole;
  };

  const handleRoleChange = async (memberId: string, displayRole: string) => {
    setLoadingMemberId(memberId);
    
    try {
      const dbRole = getRoleValue(displayRole);
      await updateTenantMember(memberId, dbRole);
      
      toast({
        title: "會友角色已更新",
        description: "會友的角色已成功更新。",
      });
      onMemberUpdated();
    } catch (error: any) {
      toast({
        title: "更新會友時出錯",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`確定要從租戶中移除 ${memberName || "此會友"} 嗎？`)) {
      return;
    }

    setLoadingMemberId(memberId);
    
    try {
      await deleteTenantMember(memberId);
      toast({
        title: "會友已移除",
        description: "會友已從租戶中移除。",
      });
      onMemberUpdated();
    } catch (error: any) {
      toast({
        title: "移除會友時出錯",
        description: error.message || "發生未知錯誤",
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
        full_name: firstName && lastName ? `${firstName} ${lastName}` : 
                   firstName ? firstName : 
                   lastName ? lastName : 
                   member.profile.full_name,
      });
      
      toast({
        title: "會友已更新",
        description: "會友的資訊已成功更新。",
      });
      
      setEditingMemberId(null);
      onMemberUpdated();
    } catch (error: any) {
      toast({
        title: "更新會友時出錯",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const aIsAdmin = a.role === "管理者" || a.role === "owner";
    const bIsAdmin = b.role === "管理者" || b.role === "owner";
    
    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;
    return 0;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>名字</TableHead>
            <TableHead>姓氏</TableHead>
            <TableHead>電子郵件</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>加入時間</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                找不到會友。
              </TableCell>
            </TableRow>
          )}
          
          {sortedMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.profile?.full_name || "匿名"}</TableCell>
              
              <TableCell>
                {editingMemberId === member.id ? (
                  <Input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="名字"
                    className="w-full max-w-[150px]"
                  />
                ) : (
                  member.profile?.first_name || "-"
                )}
              </TableCell>
              
              <TableCell>
                {editingMemberId === member.id ? (
                  <MemberNameEditor 
                    firstName={firstName}
                    lastName={lastName}
                    setFirstName={setFirstName}
                    setLastName={setLastName}
                    onSave={() => saveNameChanges(member)}
                    onCancel={cancelEditing}
                    isLoading={loadingMemberId === member.id}
                  />
                ) : (
                  member.profile?.last_name || "-"
                )}
              </TableCell>
              
              <TableCell>{member.profile?.email}</TableCell>
              
              <TableCell>
                <MemberRoleSelect
                  role={member.role}
                  onRoleChange={(role) => handleRoleChange(member.id, role)}
                  isCurrentUserOwner={isCurrentUserOwner}
                />
              </TableCell>
              
              <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
              
              <TableCell className="text-right">
                <MemberTableActions
                  isCurrentUserOwner={isCurrentUserOwner}
                  isEditing={editingMemberId === member.id}
                  isLoading={loadingMemberId === member.id}
                  onEditClick={() => startEditing(member)}
                  onDeleteClick={() => handleDeleteMember(member.id, member.profile?.full_name || "")}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
