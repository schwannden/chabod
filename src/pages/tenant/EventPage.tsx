import { useEffect, useState, useCallback } from "react";
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

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const [events, setEvents] = useState<EventWithGroups[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  // Use our custom filters hook
  const {
    selectedGroup,
    setSelectedGroup,
    startDate,
    setStartDate,
    endDate,
    setEndDate
  } = useEventFilters();

  const fetchEvents = useCallback(async () => {
    try {
      setIsEventsLoading(true);
      
      // Build a query that joins events with events_groups and groups
      let query = supabase
        .from("events")
        .select(`
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
      let filteredData = data.map(
        event => ({
          ...event,
          groups: event.events_groups.map(eventGroup => eventGroup.group)
 }));
      if (selectedGroup !== "all") {
        filteredData = filteredData?.filter(event => 
          event.events_groups?.some(eg => eg.group.id === selectedGroup)
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

  const fetchGroups = useCallback(async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("tenant_id", tenantId);
        
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error",
        description: "Failed to load groups. Some features may be limited.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const handleEventUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Convert EventWithGroups (with groups as Group[]) to format expected by EventCalendar (with groups as string[])
  const eventsForCalendar = events.map(event => ({
    ...event,
    groups: event.groups?.map(group => group.id) || []
  }));

  // Return the refactored page using the generic component
  return slug ? (
    <GenericEventPage
      slug={slug}
      title="活動"
      calendar={
        <EventCalendar 
          events={eventsForCalendar}
          groups={groups || []}
          isLoading={isEventsLoading}
        />
      }
      filterBar={
        <EventFilterBar
          groups={groups || []}
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
          groups={groups || []}
        />
      }
      actionButton={
        user ? (
          <CreateEventDialog 
            tenantId={slug} 
            onEventCreated={handleEventUpdated}
            allGroups={groups || []}
          />
        ) : null
      }
      fetchBaseData={fetchGroups}
    />
  ) : null;
}
