import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createServiceEvent, updateServiceEvent } from "@/lib/services/service-event-crud";
import { updateServiceEventOwners } from "@/lib/services/service-event-owners";
import { ServiceEventOwner } from "@/components/ServiceEvents/ServiceEventOwnerSelect";

export interface ServiceEventFormValues {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  subtitle: string;
}

export function useServiceEventForm(
  tenantId: string,
  eventId?: string,
  onSuccess?: () => void,
  initialServiceId?: string,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || "");
  const [selectedOwners, setSelectedOwners] = useState<ServiceEventOwner[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (values: ServiceEventFormValues, isEditMode = false) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && eventId) {
        // Update existing event
        await updateServiceEvent(eventId, {
          service_id: values.serviceId,
          date: values.date,
          start_time: values.startTime,
          end_time: values.endTime,
          subtitle: values.subtitle || null,
          tenant_id: tenantId,
        });

        // Update the service event owners
        const owners = selectedOwners.map((owner) => ({
          user_id: owner.userId,
          service_role_id: owner.roleId,
          tenant_id: tenantId,
        }));

        await updateServiceEventOwners(eventId, owners);

        toast({
          title: "成功",
          description: "服事排班已更新",
        });
      } else {
        // Create new event
        const newEvent = await createServiceEvent({
          service_id: values.serviceId,
          tenant_id: tenantId,
          date: values.date,
          start_time: values.startTime,
          end_time: values.endTime,
          subtitle: values.subtitle || null,
        });

        // Update owners if needed for new event
        if (selectedOwners.length > 0 && newEvent.id) {
          const owners = selectedOwners.map((owner) => ({
            user_id: owner.userId,
            service_role_id: owner.roleId,
            tenant_id: tenantId,
          }));

          await updateServiceEventOwners(newEvent.id, owners);
        }

        toast({
          title: isEditMode ? "服事排班複製成功" : "服事排班創建成功",
          description: isEditMode ? "新的服事排班已建立" : "新的服事排班已創建",
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error handling service event:", error);
      toast({
        title: "錯誤",
        description: isEditMode ? "更新服事排班時出錯" : "創建服事排班時出錯",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    selectedServiceId,
    setSelectedServiceId,
    selectedOwners,
    setSelectedOwners,
    handleSubmit,
  };
}
