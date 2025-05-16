import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceEventForm } from "./ServiceEventForm";
import { ServiceEventWithService } from "@/lib/services/types";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ServiceEventOwnerSelect } from "./ServiceEventOwnerSelect";
import { useServiceEventForm, ServiceEventFormValues } from "@/hooks/useServiceEventForm";
import { useEffect, useState } from "react";
import { getServiceEventOwners } from "@/lib/services/service-event-owners";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);

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

  // Fetch existing owners when opening the dialog
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
          <DialogTitle>複製服事排班</DialogTitle>
        </DialogHeader>
        <ServiceEventForm
          initialValues={{
            date: event.date,
            startTime: event.start_time,
            endTime: event.end_time,
            subtitle: event.subtitle || "",
            serviceId: event.service_id,
          }}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          submitButtonText="複製排班"
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
              {isSubmitting ? "提交中..." : "複製"}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
