
import { format } from "date-fns";
import { ServiceEventWithService } from "@/lib/services/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
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
import { useState } from "react";
import { ServiceEventEditDialog } from "./ServiceEventEditDialog";

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
  services
}: ServiceEventRowProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>{format(new Date(event.date), "yyyy-MM-dd")}</TableCell>
        <TableCell>{event.start_time} - {event.end_time}</TableCell>
        <TableCell>{event.service.name}</TableCell>
        <TableCell>{event.subtitle || "—"}</TableCell>
        <TableCell>
          {isEditable && (
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認刪除</AlertDialogTitle>
                    <AlertDialogDescription>
                      您確定要刪除這個服事排班嗎？此操作無法撤銷。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await onDeleteEvent(event.id);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      刪除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
    </>
  );
}
