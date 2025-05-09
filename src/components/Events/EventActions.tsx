
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete event
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this event? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await onDeleteEvent(event.id);
                    setIsDeleteDialogOpen(false);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
