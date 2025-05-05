
import { supabase } from "@/integrations/supabase/client";
import { ServiceEvent, ServiceEventWithOwners, ServiceEventWithService } from "./types";
import { getServiceEventOwners } from "./service-event-owners";

/**
 * Get a single service event by ID
 */
export async function getServiceEvent(id: string): Promise<ServiceEvent> {
  const { data, error } = await supabase
    .from("service_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching service event:", error);
    throw error;
  }

  return data;
}

/**
 * Get all service events for a specific service
 */
export async function getServiceEvents(serviceId: string): Promise<ServiceEvent[]> {
  const { data, error } = await supabase
    .from("service_events")
    .select("*")
    .eq("service_id", serviceId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching service events:", error);
    throw error;
  }

  return data;
}

/**
 * Get a service event with its owners
 */
export async function getServiceEventWithOwners(id: string): Promise<ServiceEventWithOwners> {
  // First get the event details
  const { data: eventData, error: eventError } = await supabase
    .from("service_events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError) {
    console.error("Error fetching service event:", eventError);
    throw eventError;
  }

  // Get all owners with their details
  const ownerDetails = await getServiceEventOwners(id);

  return {
    ...eventData,
    owners: ownerDetails
  };
}

/**
 * Get service events with owners based on filters
 */
export async function getServiceEventsWithOwners(
  serviceId?: string,
  startDate?: string,
  endDate?: string
): Promise<ServiceEventWithOwners[]> {
  // Start with the basic query
  let query = supabase.from("service_events").select("*");
    
  // Apply filters if provided
  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }
  
  if (startDate) {
    query = query.gte("date", startDate);
  }
  
  if (endDate) {
    query = query.lte("date", endDate);
  }
  
  // Execute the query
  const { data: events, error } = await query.order("date", { ascending: true });
  
  if (error) {
    console.error("Error fetching service events:", error);
    throw error;
  }
  
  // For each event, fetch its owners with details
  const eventsWithOwners: ServiceEventWithOwners[] = [];
  
  for (const event of events || []) {
    try {
      const owners = await getServiceEventOwners(event.id);
      eventsWithOwners.push({
        ...event,
        owners
      });
    } catch (eventError) {
      console.error(`Error processing event ${event.id}:`, eventError);
      eventsWithOwners.push({ ...event, owners: [] });
    }
  }
  
  return eventsWithOwners;
}

/**
 * Get service events with service information for display in lists
 */
export async function getServiceEventsWithServices(
  tenantId: string,
  serviceId?: string,
  startDate?: string,
  endDate?: string
): Promise<ServiceEventWithService[]> {
  // Start with the basic query
  let query = supabase.from("service_events").select("*").eq("tenant_id", tenantId);
    
  // Apply filters if provided
  if (serviceId && serviceId !== "all") {
    query = query.eq("service_id", serviceId);
  }
  
  if (startDate) {
    query = query.gte("date", startDate);
  }
  
  if (endDate) {
    query = query.lte("date", endDate);
  }
  
  // Execute the query
  const { data: eventsData, error } = await query.order("date", { ascending: true });
  
  if (error) {
    console.error("Error fetching service events:", error);
    throw error;
  }
  
  // If no events, return early
  if (!eventsData?.length) {
    return [];
  }
  
  // Get service details in a separate query
  const serviceIds = [...new Set(eventsData.map(event => event.service_id))];
  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, name")
    .in("id", serviceIds);
    
  if (servicesError) {
    console.error("Error fetching services:", servicesError);
    throw servicesError;
  }
  
  // Create a map for quick lookups
  const serviceMap = new Map(servicesData?.map(s => [s.id, s]) || []);
  
  // Join the data manually
  const enrichedEvents: ServiceEventWithService[] = eventsData.map(event => ({
    ...event,
    service: serviceMap.get(event.service_id) || { id: event.service_id, name: "Unknown" }
  }));
  
  return enrichedEvents;
}
