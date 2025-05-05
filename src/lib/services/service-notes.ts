import { supabase } from "@/integrations/supabase/client";
import { ServiceNote } from "./types";

export async function addServiceNote(
  note: Omit<ServiceNote, "id" | "created_at" | "updated_at">,
): Promise<ServiceNote> {
  const { data, error } = await supabase.from("service_notes").insert(note).select().single();

  if (error) {
    console.error("Error adding service note:", error);
    throw error;
  }

  return data;
}

export async function getServiceNotes(serviceId: string): Promise<ServiceNote[]> {
  const { data, error } = await supabase
    .from("service_notes")
    .select("*")
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service notes:", error);
    throw error;
  }

  return data;
}

export async function updateServiceNote(
  id: string,
  updates: Partial<Omit<ServiceNote, "id" | "created_at" | "updated_at">>,
): Promise<ServiceNote> {
  const { data, error } = await supabase
    .from("service_notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating service note:", error);
    throw error;
  }

  return data;
}

export async function deleteServiceNote(id: string): Promise<void> {
  const { error } = await supabase.from("service_notes").delete().eq("id", id);

  if (error) {
    console.error("Error deleting service note:", error);
    throw error;
  }
}

export async function deleteServiceNotes(serviceId: string): Promise<void> {
  const { error } = await supabase.from("service_notes").delete().eq("service_id", serviceId);

  if (error) {
    console.error("Error deleting service notes:", error);
    throw error;
  }
}
