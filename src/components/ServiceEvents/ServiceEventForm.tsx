import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceEventOwner } from "./ServiceEventOwnerSelect";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the form schema with Zod for validation
const serviceEventSchema = z.object({
  serviceId: z.string().min(1, "Service type is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  subtitle: z.string().optional(),
});

export type ServiceEventFormValues = z.infer<typeof serviceEventSchema>;

interface ServiceEventFormProps {
  onSubmit: (values: ServiceEventFormValues) => void;
  services: {
    id: string;
    name: string;
    default_start_time?: string | null;
    default_end_time?: string | null;
  }[];
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  selectedOwners: ServiceEventOwner[];
  setSelectedOwners: (owners: ServiceEventOwner[]) => void;
  tenantId: string;
  isSubmitting: boolean;
  onCancel: () => void;
  children?: React.ReactNode;
  defaultStartTime?: string;
  defaultEndTime?: string;
  initialValues?: ServiceEventFormValues;
  isEditMode?: boolean;
  isLoading?: boolean;
  submitButtonText?: string;
  disableServiceSelection?: boolean;
}

export function ServiceEventForm({
  onSubmit,
  services,
  selectedServiceId,
  setSelectedServiceId,
  setSelectedOwners,
  children,
  defaultStartTime,
  defaultEndTime,
  initialValues,
  isEditMode,
  disableServiceSelection,
}: ServiceEventFormProps) {
  const today = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD

  const form = useForm<ServiceEventFormValues>({
    resolver: zodResolver(serviceEventSchema),
    defaultValues: initialValues || {
      serviceId: selectedServiceId || "",
      date: today,
      startTime: defaultStartTime || "",
      endTime: defaultEndTime || "",
      subtitle: "",
    },
  });

  // Update form values when default times change
  useEffect(() => {
    if (!initialValues && defaultStartTime) {
      form.setValue("startTime", defaultStartTime);
    }

    if (!initialValues && defaultEndTime) {
      form.setValue("endTime", defaultEndTime);
    }
  }, [defaultStartTime, defaultEndTime, form, initialValues]);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    form.setValue("serviceId", serviceId);

    // Clear owners when changing service as they're tied to specific roles
    setSelectedOwners([]);
  };

  const handleFormSubmit = (values: ServiceEventFormValues) => {
    // Trim subtitle if it exists before submitting
    if (values.subtitle) {
      values.subtitle = values.subtitle.trim();
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>服事類型</FormLabel>
              <Select
                onValueChange={(value) => handleServiceChange(value)}
                value={field.value}
                disabled={isEditMode || disableServiceSelection}
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
