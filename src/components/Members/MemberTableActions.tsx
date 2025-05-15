import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

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
        title="移除會友"
        description={`您確定要將 ${memberName || "此會友"} 從教會中移除嗎？此操作無法撤銷。`}
        isLoading={isLoading}
      />
    </div>
  );
}
