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
 */
export async function associateUserWithTenant(
  userId: string,
  tenantId: string,
  role: string = "member",
): Promise<void> {
  try {
    // CRITICAL: RLS policy requires BOTH is_tenant_owner() AND check_tenant_user_limit()
    const { data: _data, error } = await supabase
      .from("tenant_members")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Tenant not found or access denied");
      }
      throw new Error(error.message);
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
