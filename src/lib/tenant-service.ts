import { supabase } from "@/integrations/supabase/client";
import { Tenant, TenantWithUsage, PriceTier } from "./types";

/**
 * Fetches all price tiers
 */
export async function getPriceTiers(): Promise<PriceTier[]> {
  const { data, error } = await supabase.from("price_tiers").select("*").order("price_monthly");

  if (error) {
    console.error("Error fetching price tiers:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetches all tenants that a user is a member of
 */
export async function getUserTenants(userId: string): Promise<TenantWithUsage[]> {
  const { data: tenantMembers, error: memberError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId);

  if (memberError) {
    console.error("Error fetching tenant memberships:", memberError);
    return [];
  }

  const tenantIds = tenantMembers.map((tm) => tm.tenant_id);

  if (tenantIds.length === 0) {
    return [];
  }

  const { data: tenants, error: tenantError } = await supabase
    .from("tenants")
    .select(
      `
      *,
      price_tier:price_tiers(*)
    `,
    )
    .in("id", tenantIds);

  if (tenantError) {
    console.error("Error fetching tenants:", tenantError);
    return [];
  }

  const tenantsWithCounts = await Promise.all(
    tenants.map(async (tenant) => {
      // Get member count
      const { count: memberCount, error: countError } = await supabase
        .from("tenant_members")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Get group count
      const { count: groupCount, error: groupError } = await supabase
        .from("groups")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Get event count
      const { count: eventCount, error: eventError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      if (countError) {
        console.error("Error counting members:", countError);
      }
      if (groupError) {
        console.error("Error counting groups:", groupError);
      }
      if (eventError) {
        console.error("Error counting events:", eventError);
      }

      return {
        ...tenant,
        memberCount: memberCount || 0,
        groupCount: groupCount || 0,
        eventCount: eventCount || 0,
      };
    }),
  );

  return tenantsWithCounts;
}

/**
 * Creates a new tenant
 */
export async function createTenant(name: string, slug: string): Promise<Tenant | null> {
  // Get the free tier ID first
  const { data: freeTier, error: tierError } = await supabase
    .from("price_tiers")
    .select("id")
    .eq("name", "Free")
    .single();

  if (tierError) {
    console.error("Error fetching free tier:", tierError);
    throw new Error("Could not find free tier. Please contact support.");
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
      price_tier_id: freeTier.id, // Add the free tier ID
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tenant:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Updates an existing tenant
 */
export async function updateTenant(
  tenantId: string,
  name: string,
  slug: string,
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .update({
      name,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("Error updating tenant:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Deletes a tenant
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  const { error } = await supabase.from("tenants").delete().eq("id", tenantId);

  if (error) {
    console.error("Error deleting tenant:", error);
    throw new Error(error.message);
  }
}

/**
 * Fetches a tenant by its slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const { data, error } = await supabase.from("tenants").select("*").eq("slug", slug).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching tenant by slug:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in getTenantBySlug:", error);
    return null;
  }
}

/**
 * Checks if a user is the owner of a tenant
 */
export async function fetchIsTenantOwner(tenantId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking tenant ownership:", error);
      return false;
    }

    return data?.role === "owner";
  } catch (error) {
    console.error("Error in fetchIsTenantOwner:", error);
    return false;
  }
}
