
import { format } from "date-fns";
import { ServiceEventWithService } from "@/lib/services/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { ServiceEventEditDialog } from "./ServiceEventEditDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

interface ServiceEventRowProps {
  event: ServiceEventWithService;
  isEditable: boolean;
  onEventUpdated: () => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
  services: { id: string; name: string }[];
}

export function ServiceEventRow({
  event,
  isEditable,
  onEventUpdated,
  onDeleteEvent,
  services,
}: ServiceEventRowProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteEvent(event.id);
      // Explicitly call onEventUpdated to refresh the list
      onEventUpdated();
    } catch (error) {
      console.error("Error deleting service event:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell>{format(new Date(event.date), "yyyy-MM-dd")}</TableCell>
        <TableCell>
          {event.start_time} - {event.end_time}
        </TableCell>
        <TableCell>{event.service.name}</TableCell>
        <TableCell>{event.subtitle || "—"}</TableCell>
        <TableCell>
          {isEditable && (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>

      {isEditDialogOpen && (
        <ServiceEventEditDialog
          event={event}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onEventUpdated={onEventUpdated}
          services={services}
        />
      )}
      
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="確認刪除服事排班"
        description={`您確定要刪除 ${format(new Date(event.date), "yyyy-MM-dd")} 的 ${event.service.name} 服事排班嗎？此操作無法撤銷。`}
        isLoading={isDeleting}
      />
    </>
  );
}
