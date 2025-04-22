
import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useEventForm } from "@/hooks/useEventForm";
import { EventDetailsFields } from "./EventDetailsFields";
import { Group } from "@/lib/types";

interface CreateEventDialogProps {
  tenantId: string;
  onEventCreated: () => void;
  groups: Group[];
}

export function CreateEventDialog({ tenantId, onEventCreated, groups = [] }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, isLoading, onSubmit } = useEventForm(tenantId, () => {
    setOpen(false);
    onEventCreated();
  });

  // Ensure we have a valid groups array
  const safeGroups = Array.isArray(groups) ? groups : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <EventDetailsFields form={form} groups={safeGroups} />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
