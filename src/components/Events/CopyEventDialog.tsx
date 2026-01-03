import * as React from "react";
import { useEffect } from "react";
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
  const { form, isLoading, onSubmit } = useEventForm(
    tenantId,
    () => {
      onOpenChange(false);
      onEventCreated();
    },
    [], // Empty array - clear groups by default
  );

  // Set form values when the dialog opens - only keep date and time
  useEffect(() => {
    if (open && event && form) {
      // Format date properly
      const dateValue = event.date
        ? typeof event.date === "string"
          ? parse(event.date, "yyyy-MM-dd", new Date())
          : new Date(event.date)
        : new Date();

      // Only populate date and time fields, clear everything else
      form.reset({
        name: "",
        description: "",
        date: dateValue,
        isFullDay: !event.start_time && !event.end_time,
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        event_link: "",
        visibility: "public",
        groups: [],
      });
    }
  }, [open, event, form]);

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
