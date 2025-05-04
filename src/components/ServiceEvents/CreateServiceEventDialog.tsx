import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ServiceEventOwnerSelect, ServiceEventOwner } from "./ServiceEventOwnerSelect";
import { Separator } from "@/components/ui/separator";
import { ServiceEventForm, ServiceEventFormValues } from "./ServiceEventForm";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<ServiceEventOwner[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>(undefined);
  const [defaultEndTime, setDefaultEndTime] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  // Update default times when service selection changes
  useEffect(() => {
    if (selectedServiceId) {
      const selectedService = services.find(service => service.id === selectedServiceId);
      if (selectedService) {
        setDefaultStartTime(selectedService.default_start_time || undefined);
        setDefaultEndTime(selectedService.default_end_time || undefined);
      }
    }
  }, [selectedServiceId, services]);

  const handleSubmit = async (values: ServiceEventFormValues) => {
    setIsSubmitting(true);
    try {
      // First insert the service event
      const { data: eventData, error: eventError } = await supabase
        .from("service_events")
        .insert({
          service_id: values.serviceId,
          date: values.date,
          start_time: values.startTime,
          end_time: values.endTime,
          subtitle: values.subtitle || null,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Failed to create service event");

      // If we have selected owners, insert them
      if (selectedOwners.length > 0) {
        const ownersToInsert = selectedOwners.map(owner => ({
          service_event_id: eventData.id,
          user_id: owner.userId,
          service_role_id: owner.roleId,
          tenant_id: tenantId,
        }));

        const { error: ownersError } = await supabase
          .from("service_event_owners")
          .insert(ownersToInsert);

        if (ownersError) throw ownersError;
      }

      toast({
        title: "成功",
        description: "服事排班已成功創建",
      });
      
      onEventCreated();
      onClose();
    } catch (error) {
      console.error("Error creating service event:", error);
      toast({
        title: "錯誤",
        description: "創建服事排班時發生錯誤",
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
          selectedOwners={selectedOwners}
          setSelectedOwners={setSelectedOwners}
          tenantId={tenantId}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          defaultStartTime={defaultStartTime}
          defaultEndTime={defaultEndTime}
        >
          {selectedServiceId && (
            <>
              <Separator className="my-4" />
              <h3 className="text-sm font-medium mb-2">服事排班成員</h3>
              <ServiceEventOwnerSelect 
                serviceId={selectedServiceId}
                tenantId={tenantId}
                selectedOwners={selectedOwners}
                setSelectedOwners={setSelectedOwners}
              />
            </>
          )}
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "創建"}
            </Button>
          </DialogFooter>
        </ServiceEventForm>
      </DialogContent>
    </Dialog>
  );
}
