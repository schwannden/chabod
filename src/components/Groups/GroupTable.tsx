import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Group, GroupWithMemberCount } from "@/lib/types";
import { createGroup, deleteGroup, updateGroup } from "@/lib/group-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GroupTableProps {
  groups: GroupWithMemberCount[];
  tenantId: string;
  isTenantOwner: boolean;
  onGroupCreated: () => void;
  onGroupUpdated: () => void;
  onGroupDeleted: () => void;
}

export function GroupTable({
  groups,
  tenantId,
  isTenantOwner,
  onGroupCreated,
  onGroupUpdated,
  onGroupDeleted,
}: GroupTableProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();
    const trimmedDescription = newGroupDescription.trim();

    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup(tenantId, trimmedName, trimmedDescription);
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      setIsCreateOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      onGroupCreated();
    } catch (error) {
      console.error("Failed to create group:", error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    const trimmedName = newGroupName.trim();
    const trimmedDescription = newGroupDescription.trim();

    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateGroup(selectedGroup.id, trimmedName, trimmedDescription);
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
      setIsEditOpen(false);
      onGroupUpdated();
    } catch (error) {
      console.error("Failed to update group:", error);
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    try {
      await deleteGroup(selectedGroup.id);
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
      setIsDeleteOpen(false);
      onGroupDeleted();
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || "");
    setIsEditOpen(true);
  };

  const openDeleteDialog = (group: Group) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const navigateToGroupMembers = (groupId: string) => {
    navigate(`/tenant/${window.location.pathname.split("/")[2]}/groups/${groupId}`);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value.trim());
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewGroupDescription(e.target.value);
  };

  const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setNewGroupDescription(e.target.value.trim());
  };

  return (
    <div className="space-y-4">
      {isTenantOwner && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setNewGroupName("");
              setNewGroupDescription("");
              setIsCreateOpen(true);
            }}
          >
            建立群組
          </Button>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          沒有找到群組。 {isTenantOwner && "建立您的第一個群組以開始。"}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>會友</TableHead>
              <TableHead>建立時間</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.description || "-"}</TableCell>
                <TableCell>{group.memberCount}</TableCell>
                <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToGroupMembers(group.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>

                    {isTenantOwner && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(group)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(group)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>建立新群組</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">群組名稱</Label>
              <Input
                id="name"
                value={newGroupName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="輸入群組名稱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述（選填）</Label>
              <Textarea
                id="description"
                value={newGroupDescription}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="輸入群組描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup} disabled={isSubmitting}>
              {isSubmitting ? "建立中..." : "建立群組"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯群組</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">群組名稱</Label>
              <Input
                id="edit-name"
                value={newGroupName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述（選填）</Label>
              <Textarea
                id="edit-description"
                value={newGroupDescription}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateGroup} disabled={isSubmitting}>
              {isSubmitting ? "儲存中..." : "儲存變更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>刪除群組</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>您確定要刪除群組 "{selectedGroup?.name}" 嗎？此操作無法復原。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={isSubmitting}>
              {isSubmitting ? "刪除中..." : "刪除群組"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
