import { supabase } from "@/integrations/supabase/client";

export interface GroupInfo {
  id: string;
  name: string;
  description: string;
}

export async function addServiceGroup(serviceId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from("service_groups")
    .insert({ service_id: serviceId, group_id: groupId });

  if (error) {
    console.error("Error adding service group:", error);
    throw error;
  }
}

export async function removeServiceGroup(serviceId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from("service_groups")
    .delete()
    .eq("service_id", serviceId)
    .eq("group_id", groupId);

  if (error) {
    console.error("Error removing service group:", error);
    throw error;
  }
}

export async function getServiceGroups(serviceId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("service_groups")
    .select("group_id")
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service groups:", error);
    throw error;
  }

  return data.map((item) => item.group_id);
}

export async function getGroupsForServiceWithNames(serviceId: string): Promise<GroupInfo[]> {
  const { data, error } = await supabase
    .from("service_groups")
    .select(
      `
      id,
      group_id,
      groups:group_id(id, name, description)
    `,
    )
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service groups with names:", error);
    throw error;
  }

  return data.map((item) => ({
    id: item.group_id,
    name: item.groups?.name || "Unknown Group",
    description: item.groups?.description || "",
  }));
}
