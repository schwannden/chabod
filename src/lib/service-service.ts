import { supabase } from "@/integrations/supabase/client";
import { Service, ServiceAdmin, ServiceNote, ServiceRole, ServiceEvent, ServiceEventOwner, ServiceEventWithOwners, ServiceEventOwnerWithDetails } from "./types";

export async function getServices(tenantId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    console.error("Error fetching services:", error);
    throw error;
  }

  return data;
}

export async function createService(service: Omit<Service, "id" | "created_at" | "updated_at">): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  if (error) {
    console.error("Error creating service:", error);
    throw error;
  }

  return data;
}

export async function updateService(
  id: string, 
  updates: Partial<Omit<Service, "id" | "created_at" | "updated_at">>
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating service:", error);
    throw error;
  }

  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
}

export async function addServiceAdmin(serviceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("service_admins")
    .insert({ service_id: serviceId, user_id: userId });

  if (error) {
    console.error("Error adding service admin:", error);
    throw error;
  }
}

export async function removeServiceAdmin(serviceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("service_admins")
    .delete()
    .eq("service_id", serviceId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing service admin:", error);
    throw error;
  }
}

export async function addServiceNote(note: Omit<ServiceNote, "id" | "created_at" | "updated_at">): Promise<ServiceNote> {
  const { data, error } = await supabase
    .from("service_notes")
    .insert(note)
    .select()
    .single();

  if (error) {
    console.error("Error adding service note:", error);
    throw error;
  }

  return data;
}

export async function addServiceRole(role: Omit<ServiceRole, "id" | "created_at" | "updated_at">): Promise<ServiceRole> {
  const { data, error } = await supabase
    .from("service_roles")
    .insert(role)
    .select()
    .single();

  if (error) {
    console.error("Error adding service role:", error);
    throw error;
  }

  return data;
}

export async function isServiceAdmin(serviceId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("service_admins")
    .select("id")
    .eq("service_id", serviceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking service admin status:", error);
    return false;
  }

  return !!data;
}

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

export async function addServiceEventOwner(owner: Omit<ServiceEventOwner, "id" | "created_at" | "updated_at">): Promise<ServiceEventOwner> {
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

export async function removeServiceEventOwner(serviceEventId: string, userId: string, roleId: string): Promise<void> {
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

  const { data: ownersData, error: ownersError } = await supabase
    .from("service_event_owners")
    .select(`
      *,
      profile:profiles(*),
      role:service_roles(*)
    `)
    .eq("service_event_id", id);

  if (ownersError) {
    console.error("Error fetching service event owners:", ownersError);
    throw ownersError;
  }

  const serviceEventWithOwners: ServiceEventWithOwners = {
    ...eventData,
    owners: ownersData as ServiceEventOwnerWithDetails[]
  };

  return serviceEventWithOwners;
}
