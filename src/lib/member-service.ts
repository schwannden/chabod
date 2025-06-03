import { supabase } from "@/integrations/supabase/client";
import { TenantMember, TenantMemberWithProfile } from "./types";
import { getTenantBySlug } from "./tenant-service";
import { v4 as uuidv4 } from "uuid";

/**
 * Fetches all members of a tenant with their profile information
 */
export async function getTenantMembers(tenantId: string): Promise<TenantMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("tenant_members")
    .select(
      `
      *,
      profile:profiles(*)
    `,
    )
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error fetching tenant members:", error);
    return [];
  }

  return (data as TenantMemberWithProfile[]) || [];
}

/**
 * Updates a tenant member's role
 */
export async function updateTenantMember(
  memberId: string,
  role: string,
): Promise<TenantMember | null> {
  const { data, error } = await supabase
    .from("tenant_members")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    console.error("Error updating tenant member:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Deletes a tenant member
 */
export async function deleteTenantMember(memberId: string): Promise<void> {
  const { error } = await supabase.from("tenant_members").delete().eq("id", memberId);

  if (error) {
    console.error("Error deleting tenant member:", error);
    throw new Error(error.message);
  }
}

/**
 * Invites a user to join a tenant by tenant slug
 */
export async function inviteMemberToTenant(
  tenantSlug: string,
  email: string,
  role: string = "member",
): Promise<void> {
  // First get the tenant by slug
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    throw new Error(`Tenant "${tenantSlug}" not found`);
  }

  // Then use the existing function with tenantId
  await inviteUserToTenant(tenant.id, email, role);
}

/**
 * Invites a user to join a tenant
 */
export async function inviteUserToTenant(
  tenantId: string,
  email: string,
  role: string = "member",
): Promise<void> {
  const token = uuidv4();

  const { error } = await supabase.from("invitations").insert({
    tenant_id: tenantId,
    email,
    role,
    token,
  });

  if (error) {
    console.error("Error creating invitation:", error);
    throw new Error(error.message);
  }
}

/**
 * Checks if a user is a member of a tenant by slug
 * Optimized for direct access during authentication
 */
export async function checkUserTenantAccess(userId: string, tenantSlug: string): Promise<boolean> {
  try {
    // First get the tenant ID from the slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (tenantError || !tenant) {
      console.error("Error finding tenant:", tenantError);
      return false;
    }

    // Now check if the user is a member of that tenant
    const { data: member, error: memberError } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError) {
      console.error("Error checking membership:", memberError);
      return false;
    }

    return !!member;
  } catch (error) {
    console.error("Error checking tenant access:", error);
    return false;
  }
}
