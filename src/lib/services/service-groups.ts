
import { supabase } from "@/integrations/supabase/client";
import { ServiceGroup } from "./types";

export async function addServiceGroup(serviceGroup: Omit<ServiceGroup, "id" | "created_at" | "updated_at">): Promise<ServiceGroup> {
  const { data, error } = await supabase
    .from("service_groups")
    .insert(serviceGroup)
    .select()
    .single();

  if (error) {
    console.error("Error adding service group:", error);
    throw error;
  }

  return data;
}

export async function getServiceGroups(serviceId: string): Promise<ServiceGroup[]> {
  const { data, error } = await supabase
    .from("service_groups")
    .select("*")
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service groups:", error);
    throw error;
  }

  return data;
}

export async function deleteServiceGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from("service_groups")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting service group:", error);
    throw error;
  }
}

export async function getGroupsForService(serviceId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("service_groups")
    .select("group_id")
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service groups:", error);
    return [];
  }

  return data.map(item => item.group_id);
}
