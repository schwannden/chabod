
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/contexts/AuthContext";
import { CreateEventDialog } from "@/components/Events/CreateEventDialog";
import { EventFilterBar } from "@/components/Events/EventFilterBar";
import { EventList } from "@/components/Events/EventList";
import { Event, Group, Tenant, EventWithGroups } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { EventCalendar } from "@/components/Events/EventCalendar";
import React from "react";

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsWithGroups, setEventsWithGroups] = useState<EventWithGroups[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endDate, setEndDate] = useState<Date>();
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isLoading, navigate, slug]);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      try {
        const tenantData = await getTenantBySlug(slug);
        setTenant(tenantData);
      } catch (error) {
        console.error("Error fetching tenant:", error);
      }
    };
    
    fetchTenant();
  }, [slug]);

  const fetchEvents = async () => {
    try {
      setIsEventsLoading(true);
      
      let query = supabase.from("events").select("*");

      if (startDate) {
        query = query.gte("date", format(startDate, "yyyy-MM-dd"));
      }

      if (endDate) {
        query = query.lte("date", format(endDate, "yyyy-MM-dd"));
      }

      const { data: allEvents, error } = await query;
      
      if (error) throw error;
      
      if (selectedGroup === "all") {
        setEvents(allEvents || []);
        
        // Fetch event-group associations for all events
        const eventIds = allEvents?.map(e => e.id) || [];
        if (eventIds.length > 0) {
          const { data: eventGroups, error: eventGroupsError } = await supabase
            .from("events_groups")
            .select("event_id, group_id")
            .in("event_id", eventIds);
            
          if (eventGroupsError) throw eventGroupsError;
          
          // Create a map of event ID to groups
          const eventGroupMap: Record<string, string[]> = {};
          eventGroups?.forEach(eg => {
            if (!eventGroupMap[eg.event_id]) {
              eventGroupMap[eg.event_id] = [];
            }
            eventGroupMap[eg.event_id].push(eg.group_id);
          });
          
          // Merge events with their groups
          const eventsWithGroupsData = allEvents?.map(event => ({
            ...event,
            groups: eventGroupMap[event.id] || []
          }));
          
          setEventsWithGroups(eventsWithGroupsData || []);
        } else {
          setEventsWithGroups([]);
        }
        
        setIsEventsLoading(false);
        return;
      }
      
      const { data: eventGroups, error: groupError } = await supabase
        .from("events_groups")
        .select("event_id")
        .eq("group_id", selectedGroup);
        
      if (groupError) throw groupError;
      
      const eventIds = eventGroups?.map(eg => eg.event_id) || [];
      
      const filteredEvents = allEvents?.filter(event => 
        eventIds.includes(event.id)
      ) || [];
      
      setEvents(filteredEvents);
      
      // Fetch all event-group associations for filtered events
      if (filteredEvents.length > 0) {
        const filteredEventIds = filteredEvents.map(e => e.id);
        const { data: eventGroupsData, error: eventGroupsError } = await supabase
          .from("events_groups")
          .select("event_id, group_id")
          .in("event_id", filteredEventIds);
          
        if (eventGroupsError) throw eventGroupsError;
        
        // Create a map of event ID to groups
        const eventGroupMap: Record<string, string[]> = {};
        eventGroupsData?.forEach(eg => {
          if (!eventGroupMap[eg.event_id]) {
            eventGroupMap[eg.event_id] = [];
          }
          eventGroupMap[eg.event_id].push(eg.group_id);
        });
        
        // Merge events with their groups
        const eventsWithGroupsData = filteredEvents.map(event => ({
          ...event,
          groups: eventGroupMap[event.id] || []
        }));
        
        setEventsWithGroups(eventsWithGroupsData);
      } else {
        setEventsWithGroups([]);
      }
      
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      setEventsWithGroups([]);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEventsLoading(false);
    }
  };

  const handleEventUpdated = () => {
    fetchEvents();
  };

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.from("groups").select("*");
      if (error) throw error;
      console.log("Fetched groups:", data);
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
      toast({
        title: "Error",
        description: "Failed to load groups. Some features may be limited.",
        variant: "destructive",
      });
    }
  };

  const groupMap = React.useMemo(() => Object.fromEntries(groups.map(g => [g.id, g])), [groups]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchGroups();
    }
  }, [user, selectedGroup, startDate, endDate]);

  return (
    <TenantPageLayout
      title="活動"
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      isLoading={isLoading}
      breadcrumbItems={[{ label: "活動" }]}
      action={
        <CreateEventDialog 
          tenantId={slug || ""} 
          onEventCreated={fetchEvents}
          groups={groups || []}
        />
      }
    >
      <EventCalendar 
        events={events}
        groups={groups || []}
      />

      <EventFilterBar
        groups={groups || []}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />
      
      <EventList 
        events={events} 
        isLoading={isEventsLoading} 
        tenantId={slug || ""}
        onEventUpdated={handleEventUpdated}
        groups={groups || []}
      />
    </TenantPageLayout>
  );
}
