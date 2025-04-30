import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Updates a user's profile
 * @throws Error when the profile doesn't exist
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
    if (error.code === "PGRST116") {
      throw new Error(`Profile not found for user ID: ${userId}`);
    }
    throw new Error(error.message);
  }

  return data;
}
