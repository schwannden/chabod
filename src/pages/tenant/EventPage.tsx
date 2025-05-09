
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { CreateEventDialog } from "@/components/Events/CreateEventDialog";
import { EventFilterBar } from "@/components/Events/EventFilterBar";
import { EventList } from "@/components/Events/EventList";
import { Group, EventWithGroups } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { EventCalendar } from "@/components/Events/EventCalendar";
import { GenericEventPage } from "@/components/shared/GenericEventPage";
import { useEventFilters } from "@/hooks/useEventFilters";
import { getTenantGroups } from "@/lib/group-service";

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const [events, setEvents] = useState<EventWithGroups[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const [eventToCopy, setEventToCopy] = useState<EventWithGroups | undefined>(undefined);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Use our custom filters hook
  const { selectedGroup, setSelectedGroup, startDate, setStartDate, endDate, setEndDate } =
    useEventFilters();

  const fetchEvents = useCallback(async () => {
    try {
      setIsEventsLoading(true);

      // Build a query that joins events with events_groups and groups
      let query = supabase.from("events").select(`
          *,
          events_groups!inner(
            group:groups(*)
          )
        `);

      // Apply date filters if provided
      if (startDate) {
        query = query.gte("date", format(startDate, "yyyy-MM-dd"));
      }

      if (endDate) {
        query = query.lte("date", format(endDate, "yyyy-MM-dd"));
      }

      // Get the data first
      const { data, error } = await query;

      if (error) throw error;

      // Now filter by group if needed
      let filteredData = data.map((event) => ({
        ...event,
        groups: event.events_groups.map((eventGroup) => eventGroup.group),
      }));
      if (selectedGroup !== "all") {
        filteredData = filteredData?.filter((event) =>
          event.events_groups?.some((eg) => eg.group.id === selectedGroup),
        );
      }

      setEvents(filteredData);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEventsLoading(false);
    }
  }, [selectedGroup, startDate, endDate, toast]);

  const fetchAllGroups = useCallback(
    async (tenantId: string) => {
      try {
        const groups = await getTenantGroups(tenantId);
        setAllGroups(groups || []);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast({
          title: "Error",
          description: "Failed to load groups. Some features may be limited.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const handleEventUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCopyEvent = (event: EventWithGroups) => {
    setEventToCopy(event);
    setShowCopyDialog(true);
  };

  // Return the refactored page using the generic component
  return slug ? (
    <GenericEventPage
      slug={slug}
      title="活動"
      calendar={<EventCalendar events={events} isLoading={isEventsLoading} />}
      filterBar={
        <EventFilterBar
          allGroups={allGroups || []}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      }
      listView={
        <EventList
          events={events}
          isLoading={isEventsLoading}
          tenantId={slug}
          onEventUpdated={handleEventUpdated}
          allGroups={allGroups || []}
          onCopyEvent={user ? handleCopyEvent : undefined}
        />
      }
      actionButton={
        user ? (
          <>
            <CreateEventDialog
              tenantId={slug}
              onEventCreated={handleEventUpdated}
              allGroups={allGroups || []}
            />
            {showCopyDialog && eventToCopy && (
              <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader className="sticky top-0 z-10 bg-background pb-4">
                    <DialogTitle>Copy Event</DialogTitle>
                  </DialogHeader>
                  <EventForm 
                    tenantId={slug}
                    initialEvent={eventToCopy}
                    onSuccess={() => {
                      setShowCopyDialog(false);
                      setEventToCopy(undefined);
                      handleEventUpdated();
                    }}
                    onCancel={() => {
                      setShowCopyDialog(false);
                      setEventToCopy(undefined);
                    }}
                    allGroups={allGroups || []}
                  />
                </DialogContent>
              </Dialog>
            )}
          </>
        ) : null
      }
      fetchBaseData={fetchAllGroups}
    />
  ) : null;
}

// New component for event form when copying
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parse } from "date-fns";

interface EventFormProps {
  tenantId: string;
  initialEvent: EventWithGroups;
  onSuccess: () => void;
  onCancel: () => void;
  allGroups: Group[];
}

function EventForm({ tenantId, initialEvent, onSuccess, onCancel, allGroups }: EventFormProps) {
  // Extract group IDs from the initial values
  const initialGroupIds = initialEvent?.groups?.map(group => group.id) || [];
  
  const { form, isLoading, onSubmit } = useEventForm(tenantId, onSuccess, initialGroupIds);

  // Set form values when the component mounts with initialEvent
  useEffect(() => {
    if (initialEvent && form) {
      // Format date properly
      const dateValue = initialEvent.date 
        ? typeof initialEvent.date === 'string' 
          ? parse(initialEvent.date, 'yyyy-MM-dd', new Date()) 
          : new Date(initialEvent.date)
        : new Date();

      // Populate form with values from the provided event
      form.reset({
        name: initialEvent.name,
        description: initialEvent.description || "",
        date: dateValue,
        isFullDay: !initialEvent.start_time && !initialEvent.end_time,
        start_time: initialEvent.start_time || "",
        end_time: initialEvent.end_time || "",
        event_link: initialEvent.event_link || "",
        visibility: initialEvent.visibility,
        groups: initialGroupIds,
      });
    }
  }, [initialEvent, form]);

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4 pb-2">
        <EventDetailsFields form={form} groups={allGroups} />
        <div className="sticky bottom-0 pt-2 bg-background flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Copy"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
