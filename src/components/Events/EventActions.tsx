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
import { useTranslation } from "react-i18next";

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
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const { t } = useTranslation();

  // Cleanup state when component updates (e.g., after delete)
  React.useEffect(() => {
    // This ensures that if the event list updates (which happens after deletion),
    // we reset all local dialog states to prevent stuck overlays
    return () => {
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      setIsDropdownOpen(false);
    };
  }, [event.id]); // Reset when event changes or component unmounts

  // Reset states when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setIsDeleting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteEvent(event.id);
      // Immediately close dialog on success
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting event:", error);
      setIsDeleting(false);
      // Keep dialog open on error so user can retry
    }
  };

  const handleDeleteClick = () => {
    setIsDropdownOpen(false);
    // Small delay to ensure dropdown animation completes
    setTimeout(() => {
      setIsDeleteDialogOpen(true);
    }, 100);
  };

  return (
    <div className="absolute top-4 right-4">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t("common:openMenu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <EditEventDialog event={event} onEventUpdated={onEventUpdated} allGroups={allGroups}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("events:editEvent")}
            </DropdownMenuItem>
          </EditEventDialog>

          {onCopyEvent && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setIsDropdownOpen(false);
                onCopyEvent(event);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("events:copyEvent")}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleDeleteClick();
            }}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("events:deleteEvent")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleDelete}
        title={t("events:deleteEvent")}
        description={t("events:deleteEventConfirm", { eventName: event.name })}
        isLoading={isDeleting}
      />
    </div>
  );
}
