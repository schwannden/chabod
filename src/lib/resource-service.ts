import { supabase } from "@/integrations/supabase/client";
import { Resource } from "./types";

export async function getResources(tenantSlug: string): Promise<Resource[]> {
  // First get the tenant ID from the slug
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError) {
    console.error("Error fetching tenant:", tenantError);
    throw tenantError;
  }

  if (!tenantData) {
    throw new Error("Tenant not found");
  }

  // Then get resources using the tenant ID
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("tenant_id", tenantData.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching resources:", error);
    throw error;
  }

  return data || [];
}

export async function createResource(resource: Omit<Resource, "id" | "created_at" | "updated_at">): Promise<Resource> {
  const { data, error } = await supabase
    .from("resources")
    .insert(resource)
    .select()
    .single();

  if (error) {
    console.error("Error creating resource:", error);
    throw error;
  }

  return data;
}

export async function updateResource(id: string, updates: Partial<Omit<Resource, "id" | "created_at" | "updated_at">>): Promise<Resource> {
  const { data, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating resource:", error);
    throw error;
  }

  return data;
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting resource:", error);
    throw error;
  }
}

export async function addResourceToGroup(resourceId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('resources_groups')
    .insert({ resource_id: resourceId, group_id: groupId })
    .select();

  if (error) {
    console.error("Error adding resource to group:", error);
    throw error;
  }
}

export async function removeResourceFromGroup(resourceId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('resources_groups')
    .delete()
    .eq('resource_id', resourceId)
    .eq('group_id', groupId);

  if (error) {
    console.error("Error removing resource from group:", error);
    throw error;
  }
}

export async function getResourceGroups(resourceId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('resources_groups')
    .select('group_id')
    .eq('resource_id', resourceId);

  if (error) {
    console.error("Error fetching resource groups:", error);
    throw error;
  }

  return data.map(item => item.group_id);
}
