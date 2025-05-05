
import { supabase } from "@/integrations/supabase/client";
import { ServiceEventOwner, ServiceEventOwnerWithDetails } from "./types";

/**
 * Add a service event owner to an existing service event
 */
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

/**
 * Remove a service event owner from a service event
 */
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

/**
 * Create multiple service event owners
 */
export async function createServiceEventOwners(
  serviceEventId: string,
  owners: Array<{ user_id: string; service_role_id: string; tenant_id: string }>
): Promise<void> {
  if (!owners || owners.length === 0) {
    return;
  }

  const ownersToInsert = owners.map(owner => ({
    service_event_id: serviceEventId,
    user_id: owner.user_id,
    service_role_id: owner.service_role_id,
    tenant_id: owner.tenant_id
  }));

  const { error } = await supabase
    .from("service_event_owners")
    .insert(ownersToInsert);

  if (error) {
    console.error("Error adding service event owners:", error);
    throw error;
  }
}

/**
 * Get owners with details for a service event
 */
export async function getServiceEventOwners(
  serviceEventId: string
): Promise<ServiceEventOwnerWithDetails[]> {
  // Get owners data for this event
  const { data: owners, error: ownersError } = await supabase
    .from("service_event_owners")
    .select("*")
    .eq("service_event_id", serviceEventId);
    
  if (ownersError) {
    console.error(`Error getting owners for event ${serviceEventId}:`, ownersError);
    throw ownersError;
  }
  
  // Get detailed info for each owner
  const ownersWithDetails: ServiceEventOwnerWithDetails[] = [];
  
  for (const owner of owners || []) {
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", owner.user_id).maybeSingle(),
        supabase.from("service_roles").select("*").eq("id", owner.service_role_id).maybeSingle()
      ]);
      
      if (profileResult.error || roleResult.error) {
        console.warn(`Skipping owner ${owner.id} due to error fetching details`);
        continue;
      }
      
      if (profileResult.data && roleResult.data) {
        ownersWithDetails.push({
          ...owner,
          profile: profileResult.data,
          role: roleResult.data
        });
      }
    } catch (e) {
      console.error(`Error processing owner ${owner.id}:`, e);
    }
  }

  return ownersWithDetails;
}

/**
 * Update service event owners
 * This will remove all existing owners and add the new ones
 */
export async function updateServiceEventOwners(
  serviceEventId: string,
  owners: Array<{ user_id: string; service_role_id: string; tenant_id: string }>
): Promise<void> {
  // Delete all existing owners
  const { error: deleteError } = await supabase
    .from("service_event_owners")
    .delete()
    .eq("service_event_id", serviceEventId);
    
  if (deleteError) {
    console.error("Error removing existing service event owners:", deleteError);
    throw deleteError;
  }
  
  // Add new owners if any
  if (owners && owners.length > 0) {
    await createServiceEventOwners(serviceEventId, owners);
  }
}
