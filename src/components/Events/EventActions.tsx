
import React from "react";
import { EventWithGroups, Group } from "@/lib/types";
import { Trash2, MoreVertical, Pencil, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditEventDialog } from "./EditEventDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

interface EventActionsProps {
  event: EventWithGroups;
  onEventUpdated: () => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onCopyEvent?: (event: EventWithGroups) => void;
  allGroups: Group[];
}

export function EventActions({
  event,
  onEventUpdated,
  onDeleteEvent,
  onCopyEvent,
  allGroups,
}: EventActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteEvent(event.id);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="absolute top-4 right-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <EditEventDialog event={event} onEventUpdated={onEventUpdated} allGroups={allGroups}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit event
            </DropdownMenuItem>
          </EditEventDialog>

          {onCopyEvent && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onCopyEvent(event);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy event
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setIsDeleteDialogOpen(true);
            }} 
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="刪除活動"
        description={`您確定要刪除 "${event.name}" 活動嗎？此操作無法撤銷。`}
        isLoading={isDeleting}
      />
    </div>
  );
}
