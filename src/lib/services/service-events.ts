
import { supabase } from "@/integrations/supabase/client";
import { ServiceEvent, ServiceEventOwner, ServiceEventWithOwners, ServiceEventOwnerWithDetails, ServiceEventWithService } from "./types";

export async function createServiceEvent(
  event: Omit<ServiceEvent, "id" | "created_at" | "updated_at">
): Promise<ServiceEvent> {
  const { data, error } = await supabase
    .from("service_events")
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error("Error creating service event:", error);
    throw error;
  }

  return data;
}

export async function createServiceEventWithOwners(
  event: Omit<ServiceEvent, "id" | "created_at" | "updated_at">,
  owners: Array<{ user_id: string; service_role_id: string }>
): Promise<ServiceEvent> {
  // First create the event
  const { data: eventData, error: eventError } = await supabase
    .from("service_events")
    .insert(event)
    .select()
    .single();

  if (eventError) {
    console.error("Error creating service event:", eventError);
    throw eventError;
  }

  // If we have owners, create them too
  if (owners && owners.length > 0) {
    const ownersToInsert = owners.map(owner => ({
      service_event_id: eventData.id,
      user_id: owner.user_id,
      service_role_id: owner.service_role_id
    }));

    const { error: ownersError } = await supabase
      .from("service_event_owners")
      .insert(ownersToInsert);

    if (ownersError) {
      console.error("Error adding service event owners:", ownersError);
      throw ownersError;
    }
  }

  return eventData;
}

export async function updateServiceEvent(
  id: string,
  updates: Partial<Omit<ServiceEvent, "id" | "created_at" | "updated_at">>
): Promise<ServiceEvent> {
  const { data, error } = await supabase
    .from("service_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating service event:", error);
    throw error;
  }

  return data;
}

export async function deleteServiceEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("service_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting service event:", error);
    throw error;
  }
}

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

export async function addServiceEventOwner(
  owner: Omit<ServiceEventOwner, "id" | "created_at" | "updated_at">
): Promise<ServiceEventOwner> {
  const { data, error } = await supabase
    .from("service_event_owners")
    .insert(owner)
    .select()
    .single();

  if (error) {
    console.error("Error adding service event owner:", error);
    throw error;
  }

  return data;
}

export async function removeServiceEventOwner(
  serviceEventId: string,
  userId: string,
  roleId: string
): Promise<void> {
  const { error } = await supabase
    .from("service_event_owners")
    .delete()
    .eq("service_event_id", serviceEventId)
    .eq("user_id", userId)
    .eq("service_role_id", roleId);

  if (error) {
    console.error("Error removing service event owner:", error);
    throw error;
  }
}

export async function getServiceEventWithOwners(id: string): Promise<ServiceEventWithOwners> {
  const { data: eventData, error: eventError } = await supabase
    .from("service_events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError) {
    console.error("Error fetching service event:", eventError);
    throw eventError;
  }

  const ownerDetails: ServiceEventOwnerWithDetails[] = [];
  
  const { data: eventOwners, error: ownersError } = await supabase
    .from("service_event_owners")
    .select("*")
    .eq("service_event_id", id);

  if (ownersError) {
    console.error("Error fetching service event owners:", ownersError);
    throw ownersError;
  }

  for (const owner of eventOwners) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", owner.user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      continue;
    }

    const { data: role, error: roleError } = await supabase
      .from("service_roles")
      .select("*")
      .eq("id", owner.service_role_id)
      .single();

    if (roleError) {
      console.error("Error fetching role:", roleError);
      continue;
    }

    ownerDetails.push({
      ...owner,
      profile,
      role
    });
  }

  return {
    ...eventData,
    owners: ownerDetails
  };
}

export async function getServiceEventsWithOwners(
  serviceId?: string,
  startDate?: string,
  endDate?: string
): Promise<ServiceEventWithOwners[]> {
  // Start with the basic query to get events
  let query = supabase
    .from("service_events")
    .select("*");
    
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
  
  // Order by date
  query = query.order("date", { ascending: true });
  
  const { data: events, error } = await query;
  
  if (error) {
    console.error("Error fetching service events:", error);
    throw error;
  }
  
  // For each event, fetch its owners with details
  const eventsWithOwners: ServiceEventWithOwners[] = [];
  
  for (const event of events) {
    try {
      const eventWithOwners = await getServiceEventWithOwners(event.id);
      eventsWithOwners.push(eventWithOwners);
    } catch (error) {
      console.error(`Error getting owners for event ${event.id}:`, error);
      // Add the event without owners if there's an error
      eventsWithOwners.push({ ...event, owners: [] });
    }
  }
  
  return eventsWithOwners;
}
