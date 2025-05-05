
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceEventWithService } from "@/lib/services/types";
import { useToast } from "@/components/ui/use-toast";
import { getServiceEventsWithServices } from "@/lib/services/service-event-queries";

interface UseServiceEventsProps {
  tenantId: string | null;
  selectedGroup: string;
  selectedService: string;
  startDate?: Date;
  endDate?: Date;
  refreshTrigger?: number; // Add a refreshTrigger that will cause the hook to refresh when incremented
}

export function useServiceEvents({
  tenantId,
  selectedGroup,
  selectedService,
  startDate,
  endDate,
  refreshTrigger = 0, // Default to 0 if not provided
}: UseServiceEventsProps) {
  const [serviceEvents, setServiceEvents] = useState<ServiceEventWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServiceEvents = async () => {
      if (!tenantId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Format dates if present
        const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : undefined;
        const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : undefined;
        
        // Get service events with service information
        const events = await getServiceEventsWithServices(
          tenantId, 
          selectedService, 
          formattedStartDate, 
          formattedEndDate
        );
        
        // If no group filtering, return all events
        if (selectedGroup === "all") {
          setServiceEvents(events);
          return;
        }
        
        // For group filtering, we need to check service_groups
        const { data: serviceGroups, error: serviceGroupsError } = await supabase
          .from("service_groups")
          .select("service_id")
          .eq("group_id", selectedGroup);
          
        if (serviceGroupsError) throw serviceGroupsError;
        
        const serviceIds = serviceGroups?.map(sg => sg.service_id) || [];
        
        const filteredEvents = events.filter(event => 
          serviceIds.includes(event.service_id)
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
  }, [tenantId, selectedGroup, selectedService, startDate, endDate, toast, refreshTrigger]); // Add refreshTrigger as a dependency

  return { serviceEvents, isLoading };
}
