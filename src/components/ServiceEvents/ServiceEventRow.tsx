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
import { useTranslation } from "react-i18next";
import { AddToGoogleCalendarLink } from "@/components/shared/AddToGoogleCalendarLink";
import { combineDateAndTimeLocal, parseISODateLocal } from "@/lib/googleCalendar";

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
  const { t } = useTranslation("services");

  useEffect(() => {
    const fetchOwners = async () => {
      setIsLoadingOwners(true);
      try {
        const ownersData = await getServiceEventOwners(event.id);
        setOwners(ownersData);
      } catch (error) {
        console.error("Error fetching service event owners:", error);
        toast({
          title: t("error"),
          description: t("loadServicePersonnelError"),
          variant: "destructive",
        });
      } finally {
        setIsLoadingOwners(false);
      }
    };

    fetchOwners();
  }, [event.id, toast, t]);

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
        <TableCell>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">{event.service.name}</span>
            {(() => {
              const start =
                combineDateAndTimeLocal(event.date, event.start_time) ??
                parseISODateLocal(event.date) ??
                new Date();
              const end =
                combineDateAndTimeLocal(event.date, event.end_time) ??
                new Date(start.getTime() + 60 * 60 * 1000);
              const title = `${event.service.name}${event.subtitle ? ` - ${event.subtitle}` : ""}`;

              return (
                <AddToGoogleCalendarLink
                  title={title}
                  start={start}
                  end={end}
                  className="shrink-0 px-0"
                  label={t("addToGoogleCalendar")}
                />
              );
            })()}
          </div>
        </TableCell>
        <TableCell>{event.subtitle || t("emptyValue")}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {isLoadingOwners ? (
              <span className="text-xs text-muted-foreground">{t("loading")}</span>
            ) : owners.length === 0 ? (
              <span className="text-xs text-muted-foreground">{t("noAssignees")}</span>
            ) : (
              owners.map((owner) => (
                <TooltipProvider key={owner.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-default">
                        {owner.profile?.full_name || owner.profile?.email || t("unknownUser")}
                        <span className="ml-1 text-muted-foreground">
                          ({owner.role?.name || t("unknownRole")})
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        <strong>{t("role")}:</strong> {owner.role?.name || t("unknownRole")}
                      </p>
                      <p>
                        <strong>{t("name")}:</strong> {owner.profile?.full_name || t("notProvided")}
                      </p>
                      <p>
                        <strong>{t("email")}:</strong> {owner.profile?.email || t("notProvided")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            {isEditable && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsCopyDialogOpen(true)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
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
        title={t("confirmDeleteScheduleTitle")}
        description={t("confirmDeleteScheduleDescription", {
          date: format(new Date(event.date), "yyyy-MM-dd"),
          serviceName: event.service.name,
        })}
        isLoading={isDeleting}
      />
    </>
  );
}
