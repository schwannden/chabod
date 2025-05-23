import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { CreateEventDialog } from "@/components/Events/CreateEventDialog";
import { EventFilterBar } from "@/components/Events/EventFilterBar";
import { EventList } from "@/components/Events/EventList";
import { Group, EventWithGroups } from "@/lib/types";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { EventCalendar } from "@/components/Events/EventCalendar";
import { GenericEventPage } from "@/components/shared/GenericEventPage";
import { useEventFilters } from "@/hooks/useEventFilters";
import { getTenantGroups } from "@/lib/group-service";
import { getTenantEvents } from "@/lib/event-service";
import { CopyEventDialog } from "@/components/Events/CopyEventDialog";

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const [events, setEvents] = useState<EventWithGroups[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { toast } = useToast();
  const [eventToCopy, setEventToCopy] = useState<EventWithGroups | undefined>(undefined);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Use our custom filters hook
  const { selectedGroup, setSelectedGroup, startDate, setStartDate, endDate, setEndDate } =
    useEventFilters();

  const fetchEvents = useCallback(
    async (currentTenantId: string) => {
      try {
        setIsEventsLoading(true);

        // Format dates for the service function
        const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
        const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

        // Use the service function to fetch events
        const eventsData = await getTenantEvents(
          currentTenantId,
          selectedGroup,
          formattedStartDate,
          formattedEndDate,
        );

        setEvents(eventsData);
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
    },
    [selectedGroup, startDate, endDate, toast],
  );

  const fetchAllGroups = useCallback(
    async (currentTenantId: string) => {
      try {
        const groups = await getTenantGroups(currentTenantId);
        setAllGroups(groups || []);
        setTenantId(currentTenantId);
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
    if (tenantId) {
      fetchEvents(tenantId);
    }
  }, [fetchEvents, refreshTrigger, tenantId]);

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
              <CopyEventDialog
                tenantId={slug}
                onEventCreated={handleEventUpdated}
                event={eventToCopy}
                allGroups={allGroups || []}
                open={showCopyDialog}
                onOpenChange={setShowCopyDialog}
              />
            )}
          </>
        ) : null
      }
      fetchBaseData={fetchAllGroups}
    />
  ) : null;
}
