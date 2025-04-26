
import { supabase } from "@/integrations/supabase/client";
import { Service, ServiceAdmin, ServiceNote, ServiceRole } from "./types";

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
