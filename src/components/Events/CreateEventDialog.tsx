import * as React from "react";
import { useState, useMemo } from "react";
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
import { Group, EventWithGroups } from "@/lib/types";
import { parse } from "date-fns";
import { useTranslation } from "react-i18next";

interface CreateEventDialogProps {
  tenantId: string;
  onEventCreated: () => void;
  allGroups: Group[];
  initialValues?: EventWithGroups;
  trigger?: React.ReactNode;
}

export function CreateEventDialog({
  tenantId,
  onEventCreated,
  allGroups = [],
  initialValues,
  trigger,
}: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  // Extract group IDs from the initial values if provided
  const initialGroupIds = useMemo(() => {
    return initialValues?.groups?.map((group) => group.id) || [];
  }, [initialValues?.groups]);

  const { form, isLoading, onSubmit } = useEventForm(
    tenantId,
    () => {
      setOpen(false);
      onEventCreated();
    },
    initialGroupIds,
  );

  // Set form values when the dialog opens and initialValues are provided
  React.useEffect(() => {
    if (open && initialValues && form) {
      // Format date properly
      const dateValue = initialValues.date
        ? typeof initialValues.date === "string"
          ? parse(initialValues.date, "yyyy-MM-dd", new Date())
          : new Date(initialValues.date)
        : new Date();

      // Populate form with values from the provided event
      form.reset({
        name: initialValues.name,
        description: initialValues.description || "",
        date: dateValue,
        isFullDay: !initialValues.start_time && !initialValues.end_time,
        start_time: initialValues.start_time || "",
        end_time: initialValues.end_time || "",
        event_link: initialValues.event_link || "",
        visibility: initialValues.visibility,
        groups: initialGroupIds,
      });
    }
  }, [open, initialValues, form, initialGroupIds]);

  // Create a unique ID for this dialog if using for copy
  const dialogId = initialValues ? `copy-event-${initialValues.id}` : "create-event";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-dialog-trigger={dialogId}>
            {initialValues ? t("events:copyEvent") : t("events:createEvent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4">
          <DialogTitle>
            {initialValues ? t("events:copyEventTitle") : t("events:createNewEvent")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4 pb-2">
            <EventDetailsFields form={form} groups={allGroups} />
            <div className="sticky bottom-0 pt-2 bg-background flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                {t("common:cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("events:creating")
                  : initialValues
                    ? t("events:createCopy")
                    : t("events:createEvent")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
