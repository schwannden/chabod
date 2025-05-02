
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ServiceEventOwnerSelect, ServiceEventOwner } from "./ServiceEventOwnerSelect";
import { Separator } from "@/components/ui/separator";

// Schema for form validation
const formSchema = z.object({
  serviceId: z.string().min(1, "服事類型為必填"),
  date: z.string().min(1, "日期為必填"),
  startTime: z.string().min(1, "開始時間為必填"),
  endTime: z.string().min(1, "結束時間為必填"),
  subtitle: z.string().optional(),
});

type ServiceEventFormValues = z.infer<typeof formSchema>;

interface CreateServiceEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  tenantId: string;
  services: { id: string; name: string }[];
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
  const { toast } = useToast();

  // Initialize form
  const form = useForm<ServiceEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: "",
      date: "",
      startTime: "",
      endTime: "",
      subtitle: "",
    },
  });

  // Update selectedServiceId when the service changes in the form
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.serviceId && value.serviceId !== selectedServiceId) {
        setSelectedServiceId(value.serviceId);
        // Reset selected owners when service changes
        setSelectedOwners([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, selectedServiceId]);

  const onSubmit = async (values: ServiceEventFormValues) => {
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服事類型</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇服事類型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>日期</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始時間</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>結束時間</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註 (選填)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "創建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
