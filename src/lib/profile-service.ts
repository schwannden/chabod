
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Updates a user's profile
 */
export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message);
  }

  return data;
}
