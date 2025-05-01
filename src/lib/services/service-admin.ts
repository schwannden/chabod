
import { supabase } from "@/integrations/supabase/client";
import { ServiceAdmin } from "./types";

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

export async function getServiceAdmins(serviceId: string): Promise<any[]> {
  // Fix the query to join with profiles table properly
  const { data, error } = await supabase
    .from("service_admins")
    .select(`
      id, 
      user_id,
      profiles:user_id(email, full_name)
    `)
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service admins:", error);
    throw error;
  }

  return data || [];
}
