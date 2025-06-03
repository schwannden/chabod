import { createRLSTest } from "../helpers/rls-test-base";
import { getDefaultPriceTier } from "../helpers/test-data-factory";
import { serviceRoleClient, anonClient } from "../setup";

// Standard CRUD tests generated automatically using the new base class
// Note: Tenants are special since they don't belong to other tenants
const rlsTest = createRLSTest();

// For tenants, we need custom creation logic since they don't have a tenant_id
describe("Tenants RLS Policies", () => {
  describe("Tenant Creation Policy", () => {
    it("should allow authenticated users to create tenants", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner } = rlsTest.getContext();
        const defaultTier = await getDefaultPriceTier();

        const { data, error } = await owner.client
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

        // Cleanup the created tenant
        await serviceRoleClient.from("tenants").delete().eq("id", data.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent anonymous users from creating tenants", async () => {
      const defaultTier = await getDefaultPriceTier();

      const { error } = await anonClient.from("tenants").insert({
        name: "Unauthorized Tenant",
        slug: `test-unauth-${Date.now()}`,
        price_tier_id: defaultTier.id,
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("new row violates row-level security policy");
    });
  });

  describe("Tenant Update Policy", () => {
    it("should allow tenant owners to update their tenants", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent members from updating tenants", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

        const { data, error } = await member.client
          .from("tenants")
          .update({ name: "Unauthorized Update" })
          .eq("id", tenant.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent outsiders from updating tenants", async () => {
      await rlsTest.setupTestContext();

      try {
        const { outsider, tenant } = rlsTest.getContext();

        const { data, error } = await outsider.client
          .from("tenants")
          .update({ name: "Outsider Update" })
          .eq("id", tenant.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Delete Policy", () => {
    it("should allow tenant owners to delete their tenants", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, tenant } = rlsTest.getContext();

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
        // Skip cleanup since we deleted the tenant in the test
        const { owner, member, outsider } = rlsTest.getContext();
        await Promise.all([
          serviceRoleClient.from("profiles").delete().eq("id", owner.id),
          serviceRoleClient.from("profiles").delete().eq("id", member.id),
          serviceRoleClient.from("profiles").delete().eq("id", outsider.id),
        ]);
        await serviceRoleClient.auth.admin.deleteUser(owner.id);
        await serviceRoleClient.auth.admin.deleteUser(member.id);
        await serviceRoleClient.auth.admin.deleteUser(outsider.id);
      }
    });

    it("should prevent members from deleting tenants", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

        const { data, error } = await member.client
          .from("tenants")
          .delete()
          .eq("id", tenant.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify tenant still exists
        const { data: stillExists } = await serviceRoleClient
          .from("tenants")
          .select("*")
          .eq("id", tenant.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Select Policy", () => {
    it("should allow tenant members to view their tenant", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow anyone to view tenants (public read policy)", async () => {
      await rlsTest.setupTestContext();

      try {
        const { outsider, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Member Management", () => {
    it("should automatically create tenant owner when tenant is created", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner } = rlsTest.getContext();
        const defaultTier = await getDefaultPriceTier();

        // Create tenant using the user's authenticated client
        const { data: tenant, error } = await owner.client
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
          .eq("user_id", owner.id)
          .single();

        expect(memberError).toBeNull();
        expect(membership).toBeDefined();
        expect(membership.role).toBe("owner");

        // Cleanup the created tenant
        await serviceRoleClient.from("tenants").delete().eq("id", tenant.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });
});
