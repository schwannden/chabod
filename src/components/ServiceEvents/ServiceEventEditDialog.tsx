import { useState, useEffect } from "react";
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
import { getServiceEventOwners } from "@/lib/services/service-event-owners";
import { ServiceEventForm, ServiceEventFormValues } from "./ServiceEventForm";
import { ServiceEventOwnerSelect } from "./ServiceEventOwnerSelect";
import { useServiceEventForm } from "@/hooks/useServiceEventForm";

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
  const { toast } = useToast();
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);

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

  // Load existing owners when dialog opens
  useEffect(() => {
    const fetchOwners = async () => {
      if (isOpen) {
        setIsLoadingOwners(true);
        try {
          const ownersData = await getServiceEventOwners(event.id);

          // Convert to the format expected by the component
          const formattedOwners = ownersData.map((owner) => ({
            userId: owner.user_id,
            roleId: owner.service_role_id,
            profile: owner.profile,
            role: owner.role,
          }));

          setSelectedOwners(formattedOwners);
        } catch (error) {
          console.error("Error loading event owners:", error);
          toast({
            title: "錯誤",
            description: "無法載入服事人員資料",
            variant: "destructive",
          });
        } finally {
          setIsLoadingOwners(false);
        }
      }
    };

    fetchOwners();
  }, [isOpen, event.id, toast, setSelectedOwners]);

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
          <DialogTitle>編輯服事排班</DialogTitle>
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
            <div className="text-sm font-medium mb-1">服事人員分配</div>
            {isLoadingOwners ? (
              <div className="text-sm text-center py-2">正在載入服事人員...</div>
            ) : (
              <ServiceEventOwnerSelect
                serviceId={event.service_id}
                tenantId={event.tenant_id}
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
              {isSubmitting ? "提交中..." : "保存"}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
