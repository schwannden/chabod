
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Event } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EventDetailsFields } from "./EventDetailsFields";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Group } from "@/lib/types";

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

type EventFormValues = z.infer<typeof eventSchema>;

interface EditEventDialogProps {
  event: Event;
  onEventUpdated: () => void;
  groups: Group[];
  children?: React.ReactNode;
}

export function EditEventDialog({ event, onEventUpdated, groups = [], children }: EditEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventGroups, setEventGroups] = useState<string[]>([]);
  const { toast } = useToast();

  console.log("EditEventDialog rendering with event:", event.id);
  console.log("Groups prop:", groups);

  const safeGroups = Array.isArray(groups) ? groups : [];
  console.log("Safe groups after check:", safeGroups);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event.name,
      description: event.description || "",
      date: new Date(event.date),
      isFullDay: !event.start_time && !event.end_time,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      event_link: event.event_link || "",
      visibility: event.visibility,
      groups: [],
    },
  });

  useEffect(() => {
    console.log("EditEventDialog useEffect for fetching event groups, isOpen:", isOpen);
    
    const fetchEventGroups = async () => {
      if (!isOpen) return;
      console.log("Fetching event groups for event ID:", event.id);
      
      try {
        const { data, error } = await supabase
          .from("events_groups")
          .select("group_id")
          .eq("event_id", event.id);

        if (error) {
          console.error("Error fetching event groups:", error);
          return;
        }

        console.log("Raw events_groups data:", data);
        const groupIds = data?.map(eg => eg.group_id) || [];
        console.log("Extracted group IDs:", groupIds);
        
        setEventGroups(groupIds);
        form.setValue("groups", groupIds);
        console.log("Form values after setting groups:", form.getValues());
      } catch (err) {
        console.error("Failed to fetch event groups:", err);
      }
    };

    fetchEventGroups();
  }, [event.id, isOpen, form]);

  const onSubmit = async (data: EventFormValues) => {
    console.log("Submitting form with data:", data);
    setIsLoading(true);
    try {
      const { error: eventError } = await supabase
        .from("events")
        .update({
          name: data.name,
          description: data.description || null,
          date: format(data.date, "yyyy-MM-dd"),
          start_time: !data.isFullDay ? data.start_time : null,
          end_time: !data.isFullDay ? data.end_time : null,
          event_link: data.event_link || null,
          visibility: data.visibility,
        })
        .eq("id", event.id);

      if (eventError) {
        console.error("Event update error details:", eventError);
        if (eventError.message.includes("new row violates row-level security policy")) {
          throw new Error("Event limit reached. Please upgrade your plan to update more events.");
        }
        throw eventError;
      }

      const { error: deleteError } = await supabase
        .from("events_groups")
        .delete()
        .eq("event_id", event.id);

      if (deleteError) throw deleteError;

      if (data.groups && data.groups.length > 0) {
        const { error: groupError } = await supabase.from("events_groups").insert(
          data.groups.map((groupId) => ({
            event_id: event.id,
            group_id: groupId,
          }))
        );

        if (groupError) throw groupError;
      }

      console.log("Event updated successfully");
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
      
      onEventUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit event</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <EventDetailsFields form={form} groups={groups} />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
