import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createServiceEventWithOwners } from "@/lib/services/service-event-crud";
import { ServiceEventForm, ServiceEventFormValues } from "./ServiceEventForm";
import { ServiceEventOwner, ServiceEventOwnerSelect } from "./ServiceEventOwnerSelect";
import { useTranslation } from "react-i18next";

interface ServiceEventCreateDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onEventCreated: () => void;
  tenantId: string;
  services: {
    id: string;
    name: string;
    default_start_time?: string | null;
    default_end_time?: string | null;
  }[];
  trigger?: React.ReactNode;
}

export function ServiceEventCreateDialog({
  isOpen,
  onClose,
  onEventCreated,
  tenantId,
  services,
  trigger,
}: ServiceEventCreateDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.length > 0 ? services[0].id : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState<string>("");
  const [defaultEndTime, setDefaultEndTime] = useState<string>("");
  const [selectedOwners, setSelectedOwners] = useState<ServiceEventOwner[]>([]);

  const { toast } = useToast();

  // Use external state if provided, otherwise use internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onClose
    ? (open: boolean) => {
        if (!open) onClose();
      }
    : setInternalOpen;

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
        title: t("common:success"),
        description: t("serviceEvents:eventCreated"),
      });

      onEventCreated();
      setOpen(false);
    } catch (error) {
      console.error("Error creating service event:", error);
      toast({
        title: t("common:error"),
        description: t("serviceEvents:createEventError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // If no trigger is provided and we're not in controlled mode, provide default trigger
  const shouldShowTrigger = trigger !== undefined || isOpen === undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {shouldShowTrigger && (
        <DialogTrigger asChild>
          {trigger || <Button>{t("serviceEvents:createServiceEvent")}</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("serviceEvents:createServiceEventTitle")}</DialogTitle>
        </DialogHeader>

        <ServiceEventForm
          onSubmit={handleSubmit}
          services={services}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          tenantId={tenantId}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          defaultStartTime={defaultStartTime}
          defaultEndTime={defaultEndTime}
          selectedOwners={selectedOwners}
          setSelectedOwners={setSelectedOwners}
        >
          <div className="space-y-4 mb-4">
            <div className="text-sm font-medium mb-1">{t("serviceEvents:memberAssignment")}</div>
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t("common:cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common:submitting") : t("common:create")}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
