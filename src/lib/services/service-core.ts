import { supabase } from "@/integrations/supabase/client";
import { Service } from "./types";

export async function getServices(tenantId: string): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").eq("tenant_id", tenantId);

  if (error) {
    console.error("Error fetching services:", error);
    throw error;
  }

  return data;
}

export async function createService(
  service: Omit<Service, "id" | "created_at" | "updated_at">,
): Promise<Service> {
  const { data, error } = await supabase.from("services").insert(service).select().single();

  if (error) {
    console.error("Error creating service:", error);
    throw error;
  }

  return data;
}

export async function updateService(
  id: string,
  updates: Partial<Omit<Service, "id" | "created_at" | "updated_at">>,
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
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
}
