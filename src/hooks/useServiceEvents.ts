
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceEventWithService } from "@/lib/services/types";
import { useToast } from "@/components/ui/use-toast";

interface UseServiceEventsProps {
  tenantId: string | null;
  selectedGroup: string;
  selectedService: string;
  startDate?: Date;
  endDate?: Date;
}

export function useServiceEvents({
  tenantId,
  selectedGroup,
  selectedService,
  startDate,
  endDate,
}: UseServiceEventsProps) {
  const [serviceEvents, setServiceEvents] = useState<ServiceEventWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServiceEvents = async () => {
      if (!tenantId) return;
      
      try {
        setIsLoading(true);
        
        // Start with the basic query - avoid using join syntax that might cause recursion
        let query = supabase
          .from("service_events")
          .select("*");
        
        // Apply date filters if present
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          query = query.gte("date", formattedStartDate);
        }

        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          query = query.lte("date", formattedEndDate);
        }

        // Service filter
        if (selectedService !== "all") {
          query = query.eq("service_id", selectedService);
        }

        const { data: eventsData, error: eventsError } = await query;
        
        if (eventsError) throw eventsError;
        
        // If no events or no service filter, return early
        if (!eventsData?.length) {
          setServiceEvents([]);
          setIsLoading(false);
          return;
        }
        
        // Get service details in a separate query
        const serviceIds = [...new Set(eventsData.map(event => event.service_id))];
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name")
          .in("id", serviceIds);
          
        if (servicesError) throw servicesError;
        
        // Create a map for quick lookups
        const serviceMap = new Map(servicesData?.map(s => [s.id, s]) || []);
        
        // Join the data manually
        const enrichedEvents = eventsData.map(event => ({
          ...event,
          service: serviceMap.get(event.service_id) || { id: event.service_id, name: "Unknown" }
        }));
        
        // If no group filtering, return all events
        if (selectedGroup === "all") {
          setServiceEvents(enrichedEvents);
          setIsLoading(false);
          return;
        }
        
        // For group filtering, we need to check service_groups
        const { data: serviceGroups, error: serviceGroupsError } = await supabase
          .from("service_groups")
          .select("service_id")
          .eq("group_id", selectedGroup);
          
        if (serviceGroupsError) throw serviceGroupsError;
        
        const serviceIds2 = serviceGroups?.map(sg => sg.service_id) || [];
        
        const filteredEvents = enrichedEvents.filter(event => 
          serviceIds2.includes(event.service_id)
        );
        
        setServiceEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching service events:", error);
        toast({
          title: "Error",
          description: "Failed to load service events. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceEvents();
  }, [tenantId, selectedGroup, selectedService, startDate, endDate, toast]);

  return { serviceEvents, isLoading };
}
