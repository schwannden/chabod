
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ServiceEventOwner } from "./ServiceEventOwnerSelect";
import { Separator } from "@/components/ui/separator";

// Schema for form validation
export const serviceEventFormSchema = z.object({
  serviceId: z.string().min(1, "服事類型為必填"),
  date: z.string().min(1, "日期為必填"),
  startTime: z.string().min(1, "開始時間為必填"),
  endTime: z.string().min(1, "結束時間為必填"),
  subtitle: z.string().optional(),
});

export type ServiceEventFormValues = z.infer<typeof serviceEventFormSchema>;

interface ServiceEventFormProps {
  onSubmit: (values: ServiceEventFormValues) => void;
  services: { id: string; name: string; default_start_time?: string | null; default_end_time?: string | null; }[];
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  selectedOwners: ServiceEventOwner[];
  setSelectedOwners: React.Dispatch<React.SetStateAction<ServiceEventOwner[]>>;
  tenantId: string;
  isSubmitting: boolean;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ServiceEventForm({
  onSubmit,
  services,
  selectedServiceId,
  setSelectedServiceId,
  selectedOwners,
  setSelectedOwners,
  tenantId,
  isSubmitting,
  onCancel,
  children
}: ServiceEventFormProps) {
  // Initialize form
  const form = useForm<ServiceEventFormValues>({
    resolver: zodResolver(serviceEventFormSchema),
    defaultValues: {
      serviceId: "",
      date: "",
      startTime: "",
      endTime: "",
      subtitle: "",
    },
  });
  
  // When service changes, update start and end times if defaults exist
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    
    // Find the selected service
    const selectedService = services.find(service => service.id === serviceId);
    
    // If the service has default times, update the form
    if (selectedService) {
      if (selectedService.default_start_time) {
        form.setValue("startTime", selectedService.default_start_time);
      }
      
      if (selectedService.default_end_time) {
        form.setValue("endTime", selectedService.default_end_time);
      }
    }
    
    // Reset selected owners when service changes
    setSelectedOwners([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>服事類型</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleServiceChange(value);
                }}
                value={field.value}
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
        
        {children}
      </form>
    </Form>
  );
}
