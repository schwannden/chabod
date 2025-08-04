import { supabase } from "@/integrations/supabase/client";
import { TenantMember, TenantMemberWithProfile } from "./types";
import { getTenantBySlug } from "./tenant-service";
import { associateUserWithTenant } from "./membership-service";

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
 * Adds a member directly to a tenant (existing user or create new user)
 */
export async function addMemberToTenant(
  tenantSlug: string,
  email: string,
  role: string = "member",
  password?: string, // Optional for existing users
): Promise<void> {
  try {
    // PATTERN: Follow existing getTenantBySlug pattern
    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      throw new Error(`Tenant "${tenantSlug}" not found`);
    }

    // Check if user already exists
    const { data: existingUser, error: userError } =
      await supabase.auth.admin.getUserByEmail(email);

    if (userError && userError.code !== "PGRST116") {
      throw new Error(`Error checking existing user: ${userError.message}`);
    }

    let userId: string;

    if (!existingUser && password) {
      // Create new user using database function pattern
      const newUserId = crypto.randomUUID();

      const { error: createError } = await supabase.rpc("create_user", {
        user_id: newUserId,
        email: email,
        password: password,
      });

      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }

      userId = newUserId;
    } else if (existingUser) {
      userId = existingUser.id;
    } else {
      throw new Error("Password required for new user creation");
    }

    // REUSE: Existing associateUserWithTenant function (cleaned up version)
    await associateUserWithTenant(userId, tenant.id, role);
  } catch (error) {
    // PATTERN: Specific error message prefix
    throw new Error(`Error adding tenant member: ${error.message}`);
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
