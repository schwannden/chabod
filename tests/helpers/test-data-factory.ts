import { serviceRoleClient, TestUser, TestTenant, TEST_CONFIG, TEST_SESSION_ID } from "../setup";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// Default price tier for testing
let defaultPriceTier: {
  id: string;
  name: string;
  user_limit: number;
  group_limit: number;
  event_limit: number;
} | null = null;

export interface TestGroup extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
}

export interface TestResource extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  tenant_id: string;
}

export interface TestEvent extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  visibility: "public" | "private";
  tenant_id: string;
  created_by: string;
}

// Helper to generate unique identifiers with session awareness
const generateUniqueId = () => {
  const uniqueId = uuidv4().slice(0, 8);
  const timestamp = Date.now();
  return `${TEST_SESSION_ID}-${uniqueId}-${timestamp}`;
};

export const getDefaultPriceTier = async (): Promise<{
  id: string;
  name: string;
  user_limit: number;
  group_limit: number;
  event_limit: number;
}> => {
  if (defaultPriceTier) return defaultPriceTier;

  const { data, error } = await serviceRoleClient
    .from("price_tiers")
    .select("*")
    .eq("name", "Free")
    .single();

  if (error || !data) {
    // Create a default price tier for testing
    const { data: newTier, error: createError } = await serviceRoleClient
      .from("price_tiers")
      .insert({
        name: "Test Free Tier",
        price_monthly: 0,
        price_yearly: 0,
        description: "Test tier for RLS testing",
        user_limit: 10,
        group_limit: 5,
        event_limit: 20,
        is_active: true,
      })
      .select()
      .single();

    if (createError || !newTier) throw new Error("Failed to create default price tier");
    defaultPriceTier = newTier;
    return newTier;
  } else {
    defaultPriceTier = data;
    return data;
  }
};

export const createTestUser = async (
  overrides: Partial<{
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
  }> = {},
): Promise<TestUser> => {
  const uniqueId = generateUniqueId();
  const email = overrides.email || `test-user-${uniqueId}@test.example.com`;
  const fullName = overrides.fullName || `Test User ${uniqueId.slice(-8)}`;
  const firstName = overrides.firstName || "Test";
  const lastName = overrides.lastName || "User";
  const password = `test-password-${uniqueId}`;

  try {
    // Create user via service role admin API
    const { data: authData, error: authError } = await serviceRoleClient.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) throw new Error(`Auth user creation failed: ${authError.message}`);
    if (!authData.user) throw new Error("No user returned from auth creation");

    const userId = authData.user.id;

    // Always ensure profile exists - create manually if needed
    const { error: profileError } = await serviceRoleClient.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

    // Verify profile was created successfully
    const { data: verifyProfile, error: verifyError } = await serviceRoleClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!verifyProfile || verifyError) {
      throw new Error(
        `Profile verification failed: ${verifyError?.message || "Profile not found after creation"}`,
      );
    }

    // Create a new client instance and sign in the user to get a proper session
    const userClient = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey);

    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw new Error(`User sign in failed: ${signInError.message}`);
    if (!signInData.session) throw new Error("No session returned from sign in");

    // Verify authentication is working by getting current session
    const { data: sessionData } = await userClient.auth.getSession();
    if (!sessionData.session || sessionData.session.user.id !== userId) {
      throw new Error(
        `Authentication context not properly established. Expected: ${userId}, Got: ${sessionData.session?.user.id}`,
      );
    }

    return {
      id: userId,
      email,
      fullName,
      client: userClient,
    };
  } catch (error) {
    console.error("Failed to create test user:", error);
    throw error;
  }
};

export const createTestTenant = async (
  ownerId: string,
  overrides: Partial<{
    name: string;
    slug: string;
  }> = {},
): Promise<TestTenant> => {
  const defaultTier = await getDefaultPriceTier();
  if (!defaultTier) throw new Error("Failed to get default price tier");

  const uniqueId = generateUniqueId();
  const name = overrides.name || `Test Tenant ${uniqueId.slice(-8)}`;
  const slug = overrides.slug || `${uniqueId}`;

  try {
    // Check for profile existence
    const { data: profileData, error: profileError } = await serviceRoleClient
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .single();

    if (!profileData || profileError) {
      throw new Error(
        `Profile not found for owner ${ownerId}. Profile must exist before creating tenant.`,
      );
    }

    // Create tenant via service role
    const { data: tenant, error: tenantError } = await serviceRoleClient
      .from("tenants")
      .insert({
        name,
        slug,
        price_tier_id: defaultTier.id,
      })
      .select()
      .single();

    if (tenantError) throw new Error(`Tenant creation failed: ${tenantError.message}`);

    // Check if the trigger created the tenant owner automatically
    const { data: existingMember } = await serviceRoleClient
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", ownerId)
      .single();

    if (!existingMember) {
      // Manually create the owner membership if trigger didn't work
      const { error: memberError } = await serviceRoleClient.from("tenant_members").insert({
        tenant_id: tenant.id,
        user_id: ownerId,
        role: "owner",
      });

      if (memberError) throw new Error(`Tenant member creation failed: ${memberError.message}`);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      priceTierId: defaultTier.id,
    };
  } catch (error) {
    console.error("Failed to create test tenant:", error);
    throw error;
  }
};

export const addUserToTenant = async (
  userId: string,
  tenantId: string,
  role: "owner" | "member" = "member",
): Promise<void> => {
  // Verify the profile exists for the user
  const { data: profile, error: profileError } = await serviceRoleClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(
      `Profile not found for user ${userId}. Profile must exist before adding to tenant.`,
    );
  }

  const { error } = await serviceRoleClient.from("tenant_members").upsert(
    {
      tenant_id: tenantId,
      user_id: userId,
      role,
    },
    {
      onConflict: "tenant_id,user_id",
    },
  );

  if (error) throw new Error(`Failed to add user to tenant: ${error.message}`);
};

export const createTestGroup = async (
  tenantId: string,
  overrides: Partial<{
    name: string;
    description: string;
  }> = {},
): Promise<TestGroup> => {
  const uniqueId = generateUniqueId();
  const name = overrides.name || `Test Group ${uniqueId.slice(-8)}`;

  const { data: group, error } = await serviceRoleClient
    .from("groups")
    .insert({
      name,
      description: overrides.description || "Test group for RLS testing",
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw new Error(`Group creation failed: ${error.message}`);
  return group;
};

export const createTestResource = async (
  tenantId: string,
  overrides: Partial<{
    name: string;
    description: string;
    url: string;
    icon: string;
  }> = {},
): Promise<TestResource> => {
  const uniqueId = generateUniqueId();
  const name = overrides.name || `Test Resource ${uniqueId.slice(-8)}`;

  const { data: resource, error } = await serviceRoleClient
    .from("resources")
    .insert({
      name,
      description: overrides.description || "Test resource for RLS testing",
      url: overrides.url || `https://example.com/${uniqueId}`,
      icon: overrides.icon || "document",
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw new Error(`Resource creation failed: ${error.message}`);
  return resource;
};

export const createTestEvent = async (
  tenantId: string,
  createdBy: string,
  overrides: Partial<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    visibility: "public" | "private";
  }> = {},
): Promise<TestEvent> => {
  const uniqueId = generateUniqueId();
  const title = overrides.title || `Test Event ${uniqueId.slice(-8)}`;

  const { data: event, error } = await serviceRoleClient
    .from("events")
    .insert({
      name: title, // Note: the column is 'name', not 'title'
      description: overrides.description || "Test event for RLS testing",
      date: new Date().toISOString().split("T")[0], // Use date field
      start_time: "09:00:00",
      end_time: "10:00:00",
      visibility: overrides.visibility || "private",
      tenant_id: tenantId,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw new Error(`Event creation failed: ${error.message}`);
  return event;
};

export const cleanupTestUser = async (userId: string): Promise<void> => {
  try {
    // Delete from profiles first (due to foreign key constraints)
    await serviceRoleClient.from("profiles").delete().eq("id", userId);

    // Delete auth user
    const { error } = await serviceRoleClient.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`Failed to delete auth user ${userId}:`, error.message);
    }
  } catch (error) {
    console.warn("Cleanup user error:", error);
  }
};

export const cleanupTestTenant = async (tenantId: string): Promise<void> => {
  try {
    // Tenant deletion should cascade to related records
    const { error } = await serviceRoleClient.from("tenants").delete().eq("id", tenantId);

    if (error) {
      console.warn(`Failed to delete tenant ${tenantId}:`, error.message);
    }
  } catch (error) {
    console.warn("Cleanup tenant error:", error);
  }
};
