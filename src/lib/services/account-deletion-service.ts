import { supabase } from "@/integrations/supabase/client";

export interface AccountDeletionValidation {
  canDelete: boolean;
  blockers: Array<{
    type: string;
    tenantId: string;
    tenantName: string;
  }>;
}

export interface AccountDeletionRequest {
  email: string;
  confirmationToken?: string;
}

/**
 * Checks if the current user can delete their account
 * Returns validation result with any blockers (e.g., sole tenant ownership)
 */
export async function checkAccountDeletionEligibility(): Promise<AccountDeletionValidation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase.rpc("check_user_deletion_eligibility", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Error checking account deletion eligibility:", error);
    throw new Error(`Failed to check deletion eligibility: ${error.message}`);
  }

  return data as AccountDeletionValidation;
}

/**
 * Initiates account deletion by checking eligibility
 * No tokens needed - email confirmation handled in UI
 */
export async function initiateAccountDeletion(_email: string): Promise<{
  requiresConfirmation: boolean;
  blockers?: AccountDeletionValidation["blockers"];
}> {
  // Just check eligibility - no token creation needed
  const eligibility = await checkAccountDeletionEligibility();

  if (!eligibility.canDelete) {
    return {
      requiresConfirmation: false,
      blockers: eligibility.blockers,
    };
  }

  return {
    requiresConfirmation: true,
  };
}

/**
 * Completes account deletion
 * Email confirmation already handled in UI
 */
export async function deleteAccount(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Call the simplified database function to delete the account
    const { data, error } = await supabase.rpc("delete_user_account", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Database function error:", error);

      // Map database error codes to user-friendly messages
      if (error.code === "insufficient_privilege") {
        throw new Error("Not authorized to delete this account");
      } else if (error.code === "check_violation") {
        throw new Error(`Cannot delete account: ${error.message}`);
      } else {
        throw new Error(`Account deletion failed: ${error.message}`);
      }
    }

    if (!data?.success) {
      throw new Error("Account deletion failed: Unknown error");
    }

    // Account deletion successful
    // User will be automatically signed out as their account no longer exists
    await signOutUser();
  } catch (error) {
    console.error("Error calling delete account function:", error);

    // Handle network or database function errors
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to delete account: Database error");
  }
}

/**
 * Signs out the current user (utility function for cleanup after deletion)
 */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    // Don't throw here as this is cleanup after successful deletion
  }
}
