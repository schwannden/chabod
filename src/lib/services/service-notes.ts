
import { supabase } from "@/integrations/supabase/client";
import { ServiceNote } from "./types";

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
