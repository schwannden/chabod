import { supabase } from "@/integrations/supabase/client";
import { ServiceRole } from "./types";

export async function addServiceRole(
  role: Omit<ServiceRole, "id" | "created_at" | "updated_at">,
): Promise<ServiceRole> {
  const { data, error } = await supabase.from("service_roles").insert(role).select().single();

  if (error) {
    console.error("Error adding service role:", error);
    throw error;
  }

  return data;
}

export async function getServiceRoles(serviceId: string): Promise<ServiceRole[]> {
  const { data, error } = await supabase
    .from("service_roles")
    .select("*")
    .eq("service_id", serviceId)
    .order("name");

  if (error) {
    console.error("Error fetching service roles:", error);
    throw error;
  }

  return data;
}

export async function updateServiceRole(
  id: string,
  updates: Partial<Omit<ServiceRole, "id" | "created_at" | "updated_at">>,
): Promise<ServiceRole> {
  const { data, error } = await supabase
    .from("service_roles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating service role:", error);
    throw error;
  }

  return data;
}

export async function deleteServiceRole(id: string): Promise<void> {
  const { error } = await supabase.from("service_roles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting service role:", error);
    throw error;
  }
}

export async function deleteServiceRoles(serviceId: string): Promise<void> {
  const { error } = await supabase.from("service_roles").delete().eq("service_id", serviceId);

  if (error) {
    console.error("Error deleting service roles:", error);
    throw error;
  }
}
