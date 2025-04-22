
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface MemberTableActionsProps {
  isCurrentUserOwner: boolean;
  isEditing: boolean;
  isLoading: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function MemberTableActions({
  isCurrentUserOwner,
  isEditing,
  isLoading,
  onEditClick,
  onDeleteClick,
}: MemberTableActionsProps) {
  if (!isCurrentUserOwner) {
    return null;
  }

  return (
    <div className="space-x-1">
      {!isEditing && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditClick}
          disabled={isLoading}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDeleteClick}
        disabled={isLoading}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
