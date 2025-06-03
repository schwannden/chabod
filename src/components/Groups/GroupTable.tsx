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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("groups.name")}</h1>
        </div>
        {isTenantOwner && (
          <Button
            onClick={() => {
              setNewGroupName("");
              setNewGroupDescription("");
              setIsCreateOpen(true);
            }}
          >
            {t("groups.createGroup")}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("groups.name")}</TableHead>
              <TableHead>{t("groups.description")}</TableHead>
              <TableHead>{t("groups.members")}</TableHead>
              <TableHead>{t("groups.createdAt")}</TableHead>
              <TableHead className="text-right">{t("groups.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("groups.noGroupsFound")} {isTenantOwner && t("groups.createFirstGroup")}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(group)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("groups.createNewGroup")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("groups.groupName")}</Label>
              <Input
                id="name"
                value={newGroupName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder={t("groups.enterGroupName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("groups.descriptionOptional")}</Label>
              <Textarea
                id="description"
                value={newGroupDescription}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder={t("groups.enterGroupDescription")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateGroup} disabled={isSubmitting}>
              {isSubmitting ? t("common.creating") : t("groups.createGroup_")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("groups.editGroup")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("groups.groupName")}</Label>
              <Input
                id="edit-name"
                value={newGroupName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("groups.descriptionOptional")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateGroup} disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("groups.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("groups.deleteGroup")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{t("groups.deleteGroupConfirm", { groupName: selectedGroup?.name })}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={isSubmitting}>
              {isSubmitting ? t("common.deleting") : t("groups.deleteGroup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
