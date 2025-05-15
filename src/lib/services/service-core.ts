

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

export async function createServiceWithAssociations(
  service: Omit<Service, "id" | "created_at" | "updated_at">,
  adminUserIds: string[] = [],
  groupIds: string[] = [],
  notes: { text: string; link?: string }[] = [],
  roles: { name: string; description?: string }[] = [],
): Promise<Service> {
  // First, create the service
  const { data: newService, error: serviceError } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  if (serviceError) {
    console.error("Error creating service:", serviceError);
    throw serviceError;
  }

  // Process all associations in parallel
  await Promise.all([
    // Add service admins
    ...adminUserIds.map((userId) =>
      supabase
        .from("service_admins")
        .insert({ service_id: newService.id, user_id: userId })
        .then(({ error }) => {
          if (error) throw new Error(`Error adding service admin: ${error.message}`);
        }),
    ),

    // Add service groups
    ...groupIds.map((groupId) =>
      supabase
        .from("service_groups")
        .insert({ service_id: newService.id, group_id: groupId })
        .then(({ error }) => {
          if (error) throw new Error(`Error adding service group: ${error.message}`);
        }),
    ),

    // Add service notes
    ...notes.map((note) =>
      supabase
        .from("service_notes")
        .insert({
          service_id: newService.id,
          tenant_id: service.tenant_id,
          text: note.text,
          link: note.link || null,
        })
        .then(({ error }) => {
          if (error) throw new Error(`Error adding service note: ${error.message}`);
        }),
    ),

    // Add service roles
    ...roles.map((role) =>
      supabase
        .from("service_roles")
        .insert({
          service_id: newService.id,
          tenant_id: service.tenant_id,
          name: role.name,
          description: role.description || null,
        })
        .then(({ error }) => {
          if (error) throw new Error(`Error adding service role: ${error.message}`);
        }),
    ),
  ]);

  return newService;
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
