import * as React from "react";
import { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useEventForm } from "@/hooks/useEventForm";
import { EventDetailsFields } from "./EventDetailsFields";
import { Group, EventWithGroups } from "@/lib/types";
import { parse } from "date-fns";

interface CopyEventDialogProps {
  tenantId: string;
  onEventCreated: () => void;
  allGroups: Group[];
  event: EventWithGroups;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopyEventDialog({
  tenantId,
  onEventCreated,
  allGroups = [],
  event,
  open,
  onOpenChange,
}: CopyEventDialogProps) {
  // Extract group IDs from the event to populate the form
  const initialGroupIds = useMemo(() => {
    return event?.groups?.map((group) => group.id) || [];
  }, [event?.groups]);

  const { form, isLoading, onSubmit } = useEventForm(
    tenantId,
    () => {
      onOpenChange(false);
      onEventCreated();
    },
    initialGroupIds, // Pass the extracted group IDs
  );

  // Set form values when the dialog opens - populate all fields from the event
  useEffect(() => {
    if (open && event && form) {
      // Format date properly
      const dateValue = event.date
        ? typeof event.date === "string"
          ? parse(event.date, "yyyy-MM-dd", new Date())
          : new Date(event.date)
        : new Date();

      // Populate all fields from the event being copied
      form.reset({
        name: event.name,
        description: event.description || "",
        date: dateValue,
        isFullDay: !event.start_time && !event.end_time,
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        event_link: event.event_link || "",
        visibility: event.visibility,
        groups: initialGroupIds,
      });
    }
  }, [open, event, form, initialGroupIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4">
          <DialogTitle>Copy Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4 pb-2">
            <EventDetailsFields form={form} groups={allGroups} />
            <div className="sticky bottom-0 pt-2 bg-background flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Copy"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
