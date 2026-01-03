import { useState, useEffect } from "react";
import { ServiceEventWithService, ServiceRole } from "@/lib/services/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getServiceEventOwners } from "@/lib/services/service-event-owners";
import { ServiceEventForm, ServiceEventFormValues } from "./ServiceEventForm";
import {
  ServiceEventRoleAssignmentList,
  RoleAssignment,
  AssignedMember,
} from "./ServiceEventRoleAssignmentList";
import { useServiceEventForm } from "@/hooks/useServiceEventForm";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ServiceEventEditDialogProps {
  event: ServiceEventWithService;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  services: { id: string; name: string }[];
}

export function ServiceEventEditDialog({
  event,
  isOpen,
  onClose,
  onEventUpdated,
  services,
}: ServiceEventEditDialogProps) {
  const { t } = useTranslation("services");
  const { toast } = useToast();
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);

  const { isSubmitting, setSelectedServiceId, selectedOwners, setSelectedOwners, handleSubmit } =
    useServiceEventForm(
      event.tenant_id,
      event.id,
      () => {
        onEventUpdated();
        onClose();
      },
      event.service_id,
    );

  const initialValues: ServiceEventFormValues = {
    serviceId: event.service_id,
    date: event.date,
    startTime: event.start_time,
    endTime: event.end_time,
    subtitle: event.subtitle || "",
  };

  // Load existing owners and convert to RoleAssignment format
  useEffect(() => {
    const fetchOwnersAndRoles = async () => {
      if (isOpen) {
        setIsLoadingOwners(true);
        try {
          // Fetch all roles for this service
          const { data: rolesData, error: rolesError } = await supabase
            .from("service_roles")
            .select("*")
            .eq("service_id", event.service_id)
            .order("name");

          if (rolesError) throw rolesError;

          // Fetch existing owners for this event
          const ownersData = await getServiceEventOwners(event.id);

          // Create RoleAssignment structure: all roles with their assigned members
          const assignments: RoleAssignment[] = (rolesData || []).map((role) => {
            // Find all owners for this role
            const roleOwners = ownersData.filter((owner) => owner.service_role_id === role.id);

            // Convert to AssignedMember format
            const assignedMembers: AssignedMember[] = roleOwners.map((owner) => ({
              userId: owner.user_id,
              profile: owner.profile,
            }));

            return {
              roleId: role.id,
              role: role as ServiceRole,
              assignedMembers,
            };
          });

          setRoleAssignments(assignments);
        } catch (error) {
          console.error("Error loading event owners:", error);
          toast({
            title: t("error"),
            description: t("loadingError"),
            variant: "destructive",
          });
        } finally {
          setIsLoadingOwners(false);
        }
      }
    };

    fetchOwnersAndRoles();
  }, [isOpen, event.id, event.service_id, toast, t]);

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

  const onSubmit = (values: ServiceEventFormValues) => {
    // Call handleSubmit directly with the form values
    handleSubmit(
      {
        serviceId: values.serviceId,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        subtitle: values.subtitle,
      },
      true,
    ); // true indicates it's an edit operation
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editSchedule")}</DialogTitle>
        </DialogHeader>

        <ServiceEventForm
          onSubmit={onSubmit}
          services={services}
          selectedServiceId={initialValues.serviceId}
          setSelectedServiceId={setSelectedServiceId}
          tenantId={event.tenant_id}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          initialValues={initialValues}
          isEditMode={true}
          selectedOwners={selectedOwners}
          setSelectedOwners={setSelectedOwners}
        >
          <div className="space-y-4 mb-4">
            <div className="text-sm font-medium mb-1">{t("allServiceRoles")}</div>
            {isLoadingOwners ? (
              <div className="text-sm text-center py-2">{t("loading")}</div>
            ) : (
              <ServiceEventRoleAssignmentList
                serviceId={event.service_id}
                tenantId={event.tenant_id}
                roleAssignments={roleAssignments}
                setRoleAssignments={setRoleAssignments}
              />
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common:submitting") : t("save")}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
