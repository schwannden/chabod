import { supabase } from "@/integrations/supabase/client";
import { getTenantBySlug } from "./tenant-service";

/**
 * Checks if a user is a member of a tenant
 */
export async function checkTenantMembership(userId: string, tenantSlug: string): Promise<boolean> {
  try {
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return false;
    }

    const { data, error } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking tenant membership:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking tenant membership:", error);
    return false;
  }
}

/**
 * Associates a user with a tenant directly (no invitation tokens)
 * @param userId - The user's UUID
 * @param tenantIdOrSlug - Either the tenant UUID or slug
 * @param _inviteToken - Unused, kept for backward compatibility
 */
export async function associateUserWithTenant(
  userId: string,
  tenantIdOrSlug: string,
  _inviteToken?: string,
): Promise<void> {
  try {
    // Verify auth session before attempting to join
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session - user must be authenticated to join tenant");
    }

    if (session.user.id !== userId) {
      throw new Error("Session user ID mismatch");
    }

    // Determine if we have a UUID or slug
    // UUIDs are 36 chars with hyphens in specific positions
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tenantIdOrSlug,
    );

    let tenantId = tenantIdOrSlug;

    if (!isUuid) {
      // It's a slug, lookup the tenant
      const tenant = await getTenantBySlug(tenantIdOrSlug);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantIdOrSlug}`);
      }
      tenantId = tenant.id;
    }

    // Use the join_tenant_as_member function to bypass RLS issues
    // This function does all the security checks and performs the insert as postgres
    const { error } = await supabase.rpc("join_tenant_as_member", {
      p_tenant_id: tenantId,
      p_user_id: userId,
    });

    if (error) {
      // The function returns user-friendly error messages
      throw new Error(error.message || "Failed to join tenant");
    }

    // Profile creation happens automatically via database triggers
    // But verify profile exists for reliability (pattern from test-data-factory.ts)
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        // Profile fields will be populated from auth.users automatically
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.warn(`Profile verification warning: ${profileError.message}`);
      // Don't throw - profile creation is automatic, this is just verification
    }
  } catch (error) {
    throw new Error(`Error associating user with tenant: ${error.message}`);
  }
}
