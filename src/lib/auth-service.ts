import { supabase } from "@/integrations/supabase/client";

/**
 * Updates a user's password
 * @param newPassword - The new password to set
 * @throws Error when password update fails
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error updating password:", error);
    throw new Error(`Failed to update password: ${error.message}`);
  }
}

/**
 * Verifies user's current password by attempting to sign in
 * @param email - User's email address
 * @param currentPassword - Current password to verify
 * @throws Error when password verification fails
 */
export async function verifyCurrentPassword(email: string, currentPassword: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: currentPassword,
  });

  if (error) {
    console.error("Error verifying current password:", error);
    if (error.message?.toLowerCase().includes("invalid login credentials")) {
      throw new Error("Current password is incorrect");
    }
    throw new Error(`Failed to verify current password: ${error.message}`);
  }
}
