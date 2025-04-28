
import { supabase } from "@/integrations/supabase/client";
import { ServiceRole } from "./types";

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
