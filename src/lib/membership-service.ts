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
 * Associates a user with a tenant, optionally using an invite token
 */
export async function associateUserWithTenant(
  userId: string,
  tenantSlug: string,
  inviteToken?: string,
): Promise<boolean> {
  try {
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      throw new Error(`Tenant "${tenantSlug}" not found`);
    }

    const isMember = await checkTenantMembership(userId, tenantSlug);
    if (isMember) {
      return true;
    }

    let role = "member";

    if (inviteToken) {
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("token", inviteToken)
        .maybeSingle();

      if (inviteError || !invitation) {
        throw new Error("Invalid or expired invitation token");
      }

      role = invitation.role;

      await supabase.from("invitations").delete().eq("id", invitation.id);
    }

    const { error } = await supabase.from("tenant_members").insert({
      tenant_id: tenant.id,
      user_id: userId,
      role,
    });

    if (error) {
      throw new Error(`Failed to add user to tenant: ${error.message}`);
    }

    return true;
  } catch (error) {
    const errorMessage = error?.message || "未知錯誤";
    console.error("Error associating user with tenant:", error);
    throw new Error(`Failed to add user to tenant: ${errorMessage}`);
  }
}
