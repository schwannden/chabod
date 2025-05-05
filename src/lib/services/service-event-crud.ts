
import { supabase } from "@/integrations/supabase/client";
import { ServiceEvent } from "./types";
import { createServiceEventOwners } from "./service-event-owners";

/**
 * Create a new service event
 */
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

/**
 * Create a service event with owners in a single transaction
 */
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
    const ownersWithTenant = owners.map(owner => ({
      user_id: owner.user_id,
      service_role_id: owner.service_role_id,
      tenant_id: event.tenant_id
    }));
    
    await createServiceEventOwners(eventData.id, ownersWithTenant);
  }

  return eventData;
}

/**
 * Update an existing service event
 */
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

/**
 * Delete a service event
 */
export async function deleteServiceEvent(id: string): Promise<void> {
  // First delete any owners to avoid foreign key constraints
  const { error: ownersError } = await supabase
    .from("service_event_owners")
    .delete()
    .eq("service_event_id", id);
    
  if (ownersError) {
    console.error("Error deleting service event owners:", ownersError);
    throw ownersError;
  }

  // Then delete the event itself
  const { error } = await supabase
    .from("service_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting service event:", error);
    throw error;
  }
}
