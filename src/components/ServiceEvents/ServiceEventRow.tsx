import { format } from "date-fns";
import { ServiceEventWithService, ServiceEventOwnerWithDetails } from "@/lib/services/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { ServiceEventEditDialog } from "./ServiceEventEditDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { getServiceEventOwners } from "@/lib/services/service-event-owners";
import { ServiceEventCopyDialog } from "./ServiceEventCopyDialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [owners, setOwners] = useState<ServiceEventOwnerWithDetails[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOwners = async () => {
      setIsLoadingOwners(true);
      try {
        const ownersData = await getServiceEventOwners(event.id);
        setOwners(ownersData);
      } catch (error) {
        console.error("Error fetching service event owners:", error);
        toast({
          title: "錯誤",
          description: "無法載入服事人員資料",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOwners(false);
      }
    };

    fetchOwners();
  }, [event.id, toast]);

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
          <div className="flex flex-wrap gap-1">
            {isLoadingOwners ? (
              <span className="text-xs text-muted-foreground">載入中...</span>
            ) : owners.length === 0 ? (
              <span className="text-xs text-muted-foreground">未指派</span>
            ) : (
              owners.map((owner) => (
                <TooltipProvider key={owner.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-default">
                        {owner.profile?.full_name || owner.profile?.email || "未知用戶"}
                        <span className="ml-1 text-muted-foreground">
                          ({owner.role?.name || ""})
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        <strong>角色:</strong> {owner.role?.name || "未知角色"}
                      </p>
                      <p>
                        <strong>姓名:</strong> {owner.profile?.full_name || "未提供"}
                      </p>
                      <p>
                        <strong>電子郵件:</strong> {owner.profile?.email || "未提供"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            )}
          </div>
        </TableCell>
        <TableCell>
          {isEditable && (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsCopyDialogOpen(true)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
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

      {isCopyDialogOpen && (
        <ServiceEventCopyDialog
          event={event}
          isOpen={isCopyDialogOpen}
          onClose={() => setIsCopyDialogOpen(false)}
          onEventCreated={onEventUpdated}
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
