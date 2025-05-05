import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { format } from "date-fns";
import { useSession } from "@/hooks/useSession";

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  date: z.date({
    required_error: "Event date is required",
  }),
  isFullDay: z.boolean().default(false),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  event_link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  visibility: z.enum(["public", "private"]).default("public"),
  groups: z.array(z.string()).default([]),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export function useEventForm(
  tenantSlug: string,
  onSuccess: () => void,
  initialGroups: string[] = [],
) {
  const [isLoading, setIsLoading] = useState(false);
  const [tenantUuid, setTenantUuid] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useSession();

  // Ensure initialGroups is always an array
  const safeInitialGroups = Array.isArray(initialGroups) ? initialGroups : [];

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      isFullDay: false,
      event_link: "",
      visibility: "public",
      groups: safeInitialGroups,
    },
  });

  useEffect(() => {
    const fetchTenantUuid = async () => {
      if (tenantSlug) {
        try {
          const tenant = await getTenantBySlug(tenantSlug);
          if (tenant) {
            setTenantUuid(tenant.id);
          }
        } catch (err) {
          console.error("Error fetching tenant UUID:", err);
        }
      }
    };

    fetchTenantUuid();
  }, [tenantSlug]);

  const onSubmit = async (data: EventFormValues) => {
    if (!tenantUuid) {
      toast({
        title: "Error",
        description: "Unable to determine tenant ID. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check if the tenant has reached its event limit
      const { data: checkData, error: checkError } = await supabase.rpc(
        "check_tenant_event_limit",
        { tenant_uuid: tenantUuid },
      );

      if (checkError) {
        throw checkError;
      }

      if (!checkData) {
        toast({
          title: "Limit Reached",
          description:
            "You have reached the maximum number of events allowed by your plan. Please upgrade to create more events.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          name: data.name,
          description: data.description || null,
          date: format(data.date, "yyyy-MM-dd"),
          start_time: !data.isFullDay ? data.start_time : null,
          end_time: !data.isFullDay ? data.end_time : null,
          event_link: data.event_link || null,
          tenant_id: tenantUuid,
          visibility: data.visibility,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (eventError) {
        console.error("Event creation error details:", eventError);
        if (eventError.message.includes("new row violates row-level security policy")) {
          throw new Error("Event limit reached. Please upgrade your plan to create more events.");
        }
        throw eventError;
      }

      // Insert event-group associations if there are any selected groups
      if (data.groups && data.groups.length > 0) {
        const { error: groupError } = await supabase.from("events_groups").insert(
          data.groups.map((groupId) => ({
            event_id: eventData.id,
            group_id: groupId,
          })),
        );

        if (groupError) throw groupError;
      }

      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });

      form.reset();
      onSuccess();
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
