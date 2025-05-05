
import { useState } from "react";
import { ServiceEventWithService } from "@/lib/services/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { updateServiceEvent } from "@/lib/services/service-events";
import { ServiceEventForm, ServiceEventFormValues } from "./ServiceEventForm";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const initialValues: ServiceEventFormValues = {
    serviceId: event.service_id,
    date: event.date,
    startTime: event.start_time,
    endTime: event.end_time,
    subtitle: event.subtitle || "",
  };

  const handleSubmit = async (values: ServiceEventFormValues) => {
    setIsSubmitting(true);
    try {
      await updateServiceEvent(event.id, {
        service_id: values.serviceId,
        date: values.date,
        start_time: values.startTime,
        end_time: values.endTime,
        subtitle: values.subtitle || null,
        tenant_id: event.tenant_id,
      });

      toast({
        title: "成功",
        description: "服事排班已更新",
      });
      
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating service event:", error);
      toast({
        title: "錯誤",
        description: "更新服事排班時出錯",
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
          <DialogTitle>編輯服事排班</DialogTitle>
        </DialogHeader>
        
        <ServiceEventForm
          onSubmit={handleSubmit}
          services={services}
          selectedServiceId={initialValues.serviceId}
          setSelectedServiceId={() => {}} // Not allowing service change in edit mode
          tenantId={event.tenant_id}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          initialValues={initialValues}
          isEditMode={true}
          selectedOwners={[]}
          setSelectedOwners={() => {}}
        >
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "保存"}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
