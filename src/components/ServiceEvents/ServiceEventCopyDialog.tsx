import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceEventForm } from "./ServiceEventForm";
import { ServiceEventWithService } from "@/lib/services/types";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ServiceEventRoleAssignmentList, RoleAssignment } from "./ServiceEventRoleAssignmentList";
import { useServiceEventForm, ServiceEventFormValues } from "@/hooks/useServiceEventForm";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ServiceEventCopyDialogProps {
  event: ServiceEventWithService;
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export function ServiceEventCopyDialog({
  event,
  isOpen,
  onClose,
  onEventCreated,
}: ServiceEventCopyDialogProps) {
  const { t } = useTranslation("services");
  const {
    isSubmitting,
    selectedServiceId,
    setSelectedServiceId,
    selectedOwners,
    setSelectedOwners,
    handleSubmit,
  } = useServiceEventForm(
    event.tenant_id,
    undefined,
    () => {
      onEventCreated();
      onClose();
    },
    event.service_id,
  );

  // Local state for role assignments (new UX pattern)
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);

  // Clear service role assignments when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOwners([]);
      setRoleAssignments([]); // Clear role assignments too
    }
  }, [isOpen, setSelectedOwners]);

  // Sync roleAssignments to selectedOwners format for the hook
  useEffect(() => {
    const owners = roleAssignments.flatMap((assignment) =>
      assignment.assignedMembers.map((member) => ({
        userId: member.userId,
        roleId: assignment.roleId,
        profile: member.profile,
        role: assignment.role,
      })),
    );
    setSelectedOwners(owners);
  }, [roleAssignments, setSelectedOwners]);

  const onSubmit = async (values: ServiceEventFormValues) => {
    await handleSubmit(values, true); // true indicates it's a copy operation
  };

  // Mock services array with just the current service
  const services = [
    {
      id: event.service_id,
      name: event.service.name,
      default_start_time: event.start_time,
      default_end_time: event.end_time,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("copyScheduleTitle")}</DialogTitle>
        </DialogHeader>
        <ServiceEventForm
          initialValues={{
            date: event.date,
            startTime: event.start_time,
            endTime: event.end_time,
            subtitle: "",
            serviceId: event.service_id,
          }}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          submitButtonText={t("copySchedule")}
          disableServiceSelection={true}
          services={services}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          selectedOwners={selectedOwners}
          setSelectedOwners={setSelectedOwners}
          tenantId={event.tenant_id}
          isSubmitting={isSubmitting}
          onCancel={onClose}
        >
          <div className="space-y-4 mb-4">
            <div className="text-sm font-medium mb-1">{t("allServiceRoles")}</div>
            <ServiceEventRoleAssignmentList
              serviceId={event.service_id}
              tenantId={event.tenant_id}
              roleAssignments={roleAssignments}
              setRoleAssignments={setRoleAssignments}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common:submitting") : t("copySchedule")}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
