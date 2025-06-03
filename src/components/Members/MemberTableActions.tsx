import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { useTranslation } from "react-i18next";

interface MemberTableActionsProps {
  isCurrentUserOwner: boolean;
  isEditing: boolean;
  isLoading: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  memberName: string;
}

export function MemberTableActions({
  isCurrentUserOwner,
  isEditing,
  isLoading,
  onEditClick,
  onDeleteClick,
  memberName,
}: MemberTableActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { t } = useTranslation();

  if (!isCurrentUserOwner) {
    return null;
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDeleteClick();
  };

  return (
    <div className="space-x-1">
      {!isEditing && (
        <Button variant="ghost" size="icon" onClick={onEditClick} disabled={isLoading}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDeleteDialogOpen(true)}
        disabled={isLoading}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t("members.removeMember")}
        description={t("members.removeMemberConfirm", { memberName })}
        isLoading={isLoading}
      />
    </div>
  );
}
