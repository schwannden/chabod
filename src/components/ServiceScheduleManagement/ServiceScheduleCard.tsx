import { useState, useMemo } from "react";
import { format, parseISO, addWeeks } from "date-fns";
import { ServiceEventWithService, ServiceEventOwnerWithDetails } from "@/lib/services/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Copy } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ServiceScheduleCardEdit } from "./ServiceScheduleCardEdit";
import { ServiceEventCopyDialog } from "@/components/ServiceEvents/ServiceEventCopyDialog";

// Combine service info and owners for the card
export type ServiceEventForCard = ServiceEventWithService & {
  owners: ServiceEventOwnerWithDetails[];
};

interface ServiceScheduleUpdateData {
  date: string;
  startTime: string;
  endTime: string;
  subtitle: string | null;
  owners: Array<{ userId: string; roleId: string }>;
}

interface ServiceScheduleCardProps {
  event: ServiceEventForCard;
  onUpdate: (eventId: string, updates: ServiceScheduleUpdateData) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  onRefetch: () => Promise<void>;
  isEditable: boolean;
}

export function ServiceScheduleCard({
  event,
  onUpdate,
  onDelete,
  onRefetch,
  isEditable,
}: ServiceScheduleCardProps) {
  const { t } = useTranslation("services");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate next week date for copy
  const eventForCopy = useMemo(() => {
    const nextWeekDate = format(addWeeks(parseISO(event.date), 1), "yyyy-MM-dd");
    return {
      ...event,
      date: nextWeekDate,
    };
  }, [event]);

  const handleSave = async (formData: ServiceScheduleUpdateData) => {
    await onUpdate(event.id, formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(event.id);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isEditing) {
    return (
      <Card className={cn("border-primary bg-accent/5")}>
        <ServiceScheduleCardEdit event={event} onSave={handleSave} onCancel={handleCancel} />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{event.service.name}</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.date), "yyyy-MM-dd")}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.start_time} - {event.end_time}
              </p>
            </div>
            {isEditable && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  title={t("editSchedule")}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCopyDialogOpen(true)}
                  title={t("copySchedule")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title={t("deleteSchedule")}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {event.subtitle && (
            <div className="mb-3">
              <p className="text-sm font-medium">{t("subtitle")}:</p>
              <p className="text-sm text-muted-foreground">{event.subtitle}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium mb-2">{t("servicePersonnel")}:</p>
            <div className="flex flex-wrap gap-1">
              {event.owners.length === 0 ? (
                <span className="text-xs text-muted-foreground">{t("noServiceAdmins")}</span>
              ) : (
                event.owners.map((owner) => (
                  <TooltipProvider key={owner.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-default">
                          {owner.profile?.full_name || owner.profile?.email || t("anonymousMember")}
                          <span className="ml-1 text-muted-foreground">
                            ({owner.role?.name || ""})
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          <strong>{t("serviceRoles")}:</strong>{" "}
                          {owner.role?.name || t("noServiceRolesAdded")}
                        </p>
                        <p>
                          <strong>{t("name")}:</strong>{" "}
                          {owner.profile?.full_name || t("noDescription")}
                        </p>
                        <p>
                          <strong>{t("email")}:</strong> {owner.profile?.email || t("noEmail")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ServiceEventCopyDialog
        event={eventForCopy}
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onEventCreated={async () => {
          await onRefetch();
        }}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t("confirmDeleteSchedule")}
        description={t("deleteScheduleWarning")}
        isLoading={isDeleting}
      />
    </>
  );
}
