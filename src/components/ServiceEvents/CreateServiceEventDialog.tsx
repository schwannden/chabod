import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createServiceEventWithOwners } from "@/lib/services/service-event-crud";
import { ServiceEventForm, ServiceEventFormValues } from "./ServiceEventForm";
import { ServiceEventOwner, ServiceEventOwnerSelect } from "./ServiceEventOwnerSelect";

interface CreateServiceEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  tenantId: string;
  services: {
    id: string;
    name: string;
    default_start_time?: string | null;
    default_end_time?: string | null;
  }[];
}

export function CreateServiceEventDialog({
  isOpen,
  onClose,
  onEventCreated,
  tenantId,
  services,
}: CreateServiceEventDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.length > 0 ? services[0].id : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState<string>("");
  const [defaultEndTime, setDefaultEndTime] = useState<string>("");
  const [selectedOwners, setSelectedOwners] = useState<ServiceEventOwner[]>([]);

  const { toast } = useToast();

  // Update default times when selected service changes
  useEffect(() => {
    if (selectedServiceId) {
      const selectedService = services.find((s) => s.id === selectedServiceId);
      setDefaultStartTime(selectedService?.default_start_time || "");
      setDefaultEndTime(selectedService?.default_end_time || "");
    }
  }, [selectedServiceId, services]);

  const handleSubmit = async (values: ServiceEventFormValues) => {
    setIsSubmitting(true);
    try {
      const eventData = {
        service_id: values.serviceId,
        tenant_id: tenantId,
        date: values.date,
        start_time: values.startTime,
        end_time: values.endTime,
        subtitle: values.subtitle ? values.subtitle.trim() : null,
      };

      // Convert owners to the required format
      const owners = selectedOwners.map((owner) => ({
        user_id: owner.userId,
        service_role_id: owner.roleId,
        tenant_id: tenantId,
      }));

      await createServiceEventWithOwners(eventData, owners);

      toast({
        title: "成功",
        description: "服事排班已建立",
      });

      onEventCreated();
      onClose();
    } catch (error) {
      console.error("Error creating service event:", error);
      toast({
        title: "錯誤",
        description: "建立服事排班時出錯",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增服事排班</DialogTitle>
        </DialogHeader>

        <ServiceEventForm
          onSubmit={handleSubmit}
          services={services}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          tenantId={tenantId}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          defaultStartTime={defaultStartTime}
          defaultEndTime={defaultEndTime}
          selectedOwners={selectedOwners}
          setSelectedOwners={setSelectedOwners}
        >
          <div className="space-y-4 mb-4">
            <div className="text-sm font-medium mb-1">服事人員分配</div>
            {selectedServiceId && (
              <ServiceEventOwnerSelect
                serviceId={selectedServiceId}
                tenantId={tenantId}
                selectedOwners={selectedOwners}
                setSelectedOwners={setSelectedOwners}
              />
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "建立"}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
