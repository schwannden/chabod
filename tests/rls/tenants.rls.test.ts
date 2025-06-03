import { describe, it, expect, beforeEach } from "@jest/globals";
import { checkTestEnvironment, serviceRoleClient, anonClient } from "../setup";
import {
  createTestUser,
  createTestTenant,
  addUserToTenant,
  cleanupTestUser,
  cleanupTestTenant,
  getDefaultPriceTier,
} from "../helpers/test-data-factory";

describe("Tenants RLS Policies", () => {
  beforeEach(() => {
    checkTestEnvironment();
  });

  describe('Tenant Creation Policy: "Authenticated users can create tenants"', () => {
    it("should allow authenticated users to create tenants", async () => {
      const testUser = await createTestUser();
      const defaultTier = await getDefaultPriceTier();

      if (!defaultTier) throw new Error("Failed to get default price tier");

      try {
        const { data, error } = await testUser.client
          .from("tenants")
          .insert({
            name: "Test Tenant Creation",
            slug: `test-create-${Date.now()}`,
            price_tier_id: defaultTier.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Test Tenant Creation");

        // Cleanup
        await cleanupTestTenant(data.id);
      } finally {
        await cleanupTestUser(testUser.id);
      }
    });

    it("should reject unauthenticated users from creating tenants", async () => {
      const defaultTier = await getDefaultPriceTier();

      if (!defaultTier) throw new Error("Failed to get default price tier");

      const { error: insertError } = await anonClient.from("tenants").insert({
        name: "Unauthorized Tenant",
        slug: `test-unauth-${Date.now()}`,
        price_tier_id: defaultTier.id,
      });

      expect(insertError).toBeDefined();
      expect(insertError?.message).toContain("new row violates row-level security policy");
    });
  });

  describe('Tenant Update Policy: "Only owners can update tenants"', () => {
    it("should allow tenant owners to update their tenants", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await owner.client
          .from("tenants")
          .update({ name: "Updated Tenant Name" })
          .eq("id", tenant.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Updated Tenant Name");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from updating tenants", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Add member to tenant (non-owner)
        await addUserToTenant(member.id, tenant.id, "member");

        const { data, error } = await member.client
          .from("tenants")
          .update({ name: "Unauthorized Update" })
          .eq("id", tenant.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
        // Error may be null but operation should not succeed
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from updating", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await outsider.client
          .from("tenants")
          .update({ name: "Outsider Update" })
          .eq("id", tenant.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
        // Error may be null but operation should not succeed
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Tenant Delete Policy: "Only owners can delete tenants"', () => {
    it("should allow tenant owners to delete their tenants", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { error } = await owner.client.from("tenants").delete().eq("id", tenant.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("tenants")
          .select("*")
          .eq("id", tenant.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from deleting tenants", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        const { data, error } = await member.client
          .from("tenants")
          .delete()
          .eq("id", tenant.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);
        // Error may be null but operation should not succeed

        // Verify tenant still exists
        const { data: stillExists } = await serviceRoleClient
          .from("tenants")
          .select("*")
          .eq("id", tenant.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });

  describe('Tenant Select Policy: "Allow public tenant reads"', () => {
    it("should allow users to view tenants they are members of", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Owner should see the tenant
        const { data: ownerData, error: ownerError } = await owner.client
          .from("tenants")
          .select("*")
          .eq("id", tenant.id)
          .single();

        expect(ownerError).toBeNull();
        expect(ownerData).toBeDefined();

        // Member should see the tenant
        const { data: memberData, error: memberError } = await member.client
          .from("tenants")
          .select("*")
          .eq("id", tenant.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberData).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should allow anyone to view tenants (public read policy)", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Based on the current RLS policy "Allow public tenant reads"
        // outsiders can view tenants
        const { data, error } = await outsider.client
          .from("tenants")
          .select("*")
          .eq("id", tenant.id)
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.id).toBe(tenant.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe("Tenant Member Management Policies", () => {
    it("should automatically create tenant owner when tenant is created", async () => {
      const user = await createTestUser();
      const defaultTier = await getDefaultPriceTier();

      if (!defaultTier) throw new Error("Failed to get default price tier");

      try {
        // Create tenant using the user's authenticated client
        const { data: tenant, error } = await user.client
          .from("tenants")
          .insert({
            name: "Auto Owner Test",
            slug: `auto-owner-${Date.now()}`,
            price_tier_id: defaultTier.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(tenant).toBeDefined();

        // Check that the user was automatically made an owner
        const { data: membership, error: memberError } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", user.id)
          .single();

        expect(memberError).toBeNull();
        expect(membership).toBeDefined();
        expect(membership.role).toBe("owner");

        // Cleanup
        await cleanupTestTenant(tenant.id);
      } finally {
        await cleanupTestUser(user.id);
      }
    });
  });
});
