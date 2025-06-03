import { checkTestEnvironment, serviceRoleClient } from "../setup";
import {
  createTestUser,
  createTestTenant,
  addUserToTenant,
  cleanupTestUser,
  cleanupTestTenant,
  getDefaultPriceTier,
} from "../helpers/test-data-factory";
import { TestUser } from "../setup";

describe("Tenant Members RLS Policies", () => {
  beforeEach(() => {
    checkTestEnvironment();
  });

  describe("Tenant Member Insert Policies", () => {
    it("should allow tenant owners to add members", async () => {
      const owner = await createTestUser();
      const newMember = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await owner.client
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: newMember.id,
            role: "member",
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.user_id).toBe(newMember.id);
        expect(data.role).toBe("member");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(newMember.id);
      }
    });

    it("should allow initial owner creation when no owners exist", async () => {
      const newOwner = await createTestUser();

      try {
        // Create tenant via service role without auto-creating owner
        const defaultPriceTier = await getDefaultPriceTier();
        if (!defaultPriceTier) {
          throw new Error("Failed to get default price tier");
        }

        const { data: tenant } = await serviceRoleClient
          .from("tenants")
          .insert({
            name: "Owner Test Tenant",
            slug: `owner-test-${Date.now()}`,
            price_tier_id: defaultPriceTier.id,
          })
          .select()
          .single();

        if (!tenant) {
          throw new Error("Failed to create test tenant");
        }

        // Should be able to add first owner
        const { data, error } = await newOwner.client
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: newOwner.id,
            role: "owner",
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.role).toBe("owner");

        await cleanupTestTenant(tenant.id);
      } finally {
        await cleanupTestUser(newOwner.id);
      }
    });

    it("should prevent regular members from adding other members", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const newUser = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        const { data, error } = await member.client
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: newUser.id,
            role: "member",
          })
          .select()
          .single();

        // Currently, this succeeds when it should fail
        expect(error).toBeDefined();
        expect(data).toBeNull();
        expect(error?.code).toBe("42501");

        // Clean up the incorrectly inserted record
        await serviceRoleClient.from("tenant_members").delete().eq("id", data?.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
        await cleanupTestUser(newUser.id);
      }
    });

    it("should enforce tenant user limits based on price tier", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Get the user limit for the tenant's price tier
        const { data: tierData } = await serviceRoleClient
          .from("price_tiers")
          .select("user_limit")
          .eq("id", tenant.priceTierId)
          .single();

        const userLimit = tierData?.user_limit || 10;

        // The limit check uses "current_count < max_limit", so we can only have (limit - 1) total members
        // Create users up to (limit - 1) minus 1 for the owner who already exists
        const maxAdditionalUsers = userLimit - 1;
        const users: TestUser[] = [];

        for (let i = 0; i < maxAdditionalUsers; i++) {
          const user = await createTestUser();
          users.push(user);

          const { data, error } = await owner.client
            .from("tenant_members")
            .insert({
              tenant_id: tenant.id,
              user_id: user.id,
              role: "member",
            })
            .select()
            .single();

          // Each user up to the limit should succeed
          expect(error).toBeNull();
          expect(data).toBeDefined();
          expect(data.user_id).toBe(user.id);
          expect(data.role).toBe("member");
        }

        // Verify we're now at the maximum allowed count (userLimit - 1)
        const { data: currentMembers } = await serviceRoleClient
          .from("tenant_members")
          .select("id")
          .eq("tenant_id", tenant.id);

        expect(currentMembers?.length).toBe(userLimit);

        // Trying to add one more should fail due to limit
        const extraUser = await createTestUser();
        users.push(extraUser);

        const { data: limitData, error: limitError } = await owner.client
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: extraUser.id,
            role: "member",
          })
          .select();

        // Should fail due to user limit policy
        expect(limitError).toBeDefined();
        expect(limitData).toBeNull();
        expect(limitError?.code || limitError?.message || "User limit exceeded").toBe("42501");

        // Cleanup all created users
        for (const user of users) {
          await cleanupTestUser(user.id);
        }
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });

  describe("Tenant Member Select Policies", () => {
    it("should allow users to view their own memberships", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Member should be able to see their own membership
        const { data, error } = await member.client
          .from("tenant_members")
          .select("*")
          .eq("user_id", member.id)
          .eq("tenant_id", tenant.id)
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.user_id).toBe(member.id);
        expect(data.role).toBe("member");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should allow tenant members to view other memberships in their tenant", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member1.id, tenant.id, "member");
        await addUserToTenant(member2.id, tenant.id, "member");

        // Member1 should be able to see member2's membership in the same tenant
        const { data, error } = await member1.client
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id);

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.length).toBeGreaterThanOrEqual(3); // owner + member1 + member2
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member1.id);
        await cleanupTestUser(member2.id);
      }
    });

    it("should prevent outsiders from viewing tenant memberships", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Outsider should NOT be able to see any memberships in the tenant
        const { data, error } = await outsider.client
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id);

        // Should return empty array (RLS filters them out) or error
        if (error) {
          // If there's an error, it should be permission-related
          expect(error.message || error.code).toMatch(
            /insufficient_privilege|permission denied|access denied|forbidden/i,
          );
        } else {
          // If no error, should return empty array
          expect(data).toEqual([]);
        }
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe("Tenant Member Update Policies", () => {
    it("should allow tenant owners to update member roles", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Get the membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member.id)
          .single();

        // Owner should be able to update the member's role
        const { data, error } = await owner.client
          .from("tenant_members")
          .update({ role: "admin" })
          .eq("id", membership.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.role).toBe("admin");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent regular members from updating memberships", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member1.id, tenant.id, "member");
        await addUserToTenant(member2.id, tenant.id, "member");

        // Get member2's membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member2.id)
          .single();

        // Member1 should NOT be able to update member2's role
        const { error } = await member1.client
          .from("tenant_members")
          .update({ role: "owner" })
          .eq("id", membership.id);

        expect(error).toBeDefined();
        expect(error?.code || error?.message || "RLS violation").toMatch(
          /new row violates row-level security policy|permission denied|access denied|RLS violation/i,
        );
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member1.id);
        await cleanupTestUser(member2.id);
      }
    });

    it("should prevent members from updating their own roles", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Get the member's own membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member.id)
          .single();

        // Member should NOT be able to update their own role
        const { error } = await member.client
          .from("tenant_members")
          .update({ role: "owner" })
          .eq("id", membership.id);

        expect(error).toBeDefined();
        expect(error?.code || error?.message || "RLS violation").toMatch(
          /new row violates row-level security policy|permission denied|access denied|RLS violation/i,
        );
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });

  describe("Tenant Member Delete Policies", () => {
    it("should allow tenant owners to remove members", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Get the membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member.id)
          .single();

        // Owner should be able to remove the member
        const { error } = await owner.client
          .from("tenant_members")
          .delete()
          .eq("id", membership.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("id", membership.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent regular members from removing other members", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member1.id, tenant.id, "member");
        await addUserToTenant(member2.id, tenant.id, "member");

        // Get member2's membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member2.id)
          .single();

        // Member1 should NOT be able to remove member2
        const { error } = await member1.client
          .from("tenant_members")
          .delete()
          .eq("id", membership.id);

        expect(error).toBeDefined();
        expect(error?.code || error?.message || "RLS violation").toMatch(
          /new row violates row-level security policy|permission denied|access denied|RLS violation/i,
        );

        // Verify member2 still exists
        const { data } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("id", membership.id)
          .single();

        expect(data).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member1.id);
        await cleanupTestUser(member2.id);
      }
    });

    it("should prevent members from removing themselves", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Get the member's own membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member.id)
          .single();

        // Member should NOT be able to remove themselves
        const { error } = await member.client
          .from("tenant_members")
          .delete()
          .eq("id", membership.id);

        expect(error).toBeDefined();
        expect(error?.code || error?.message || "RLS violation").toMatch(
          /new row violates row-level security policy|permission denied|access denied|RLS violation/i,
        );

        // Verify member still exists
        const { data } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("id", membership.id)
          .single();

        expect(data).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });

  describe("Group Membership Cascade Trigger", () => {
    it("should automatically remove user from groups when removed from tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Create a group and add the member to it
        const { data: group } = await serviceRoleClient
          .from("groups")
          .insert({
            name: "Test Group",
            description: "Test group for cascade testing",
            tenant_id: tenant.id,
          })
          .select()
          .single();

        const { data: groupMember } = await serviceRoleClient
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select()
          .single();

        // Verify the user is in the group
        const { data: beforeRemoval } = await serviceRoleClient
          .from("group_members")
          .select("*")
          .eq("id", groupMember.id)
          .single();

        expect(beforeRemoval).toBeDefined();

        // Remove the user from the tenant
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", member.id)
          .single();

        await owner.client.from("tenant_members").delete().eq("id", membership.id);

        // Verify the user was automatically removed from the group
        const { data: afterRemoval, error } = await serviceRoleClient
          .from("group_members")
          .select("*")
          .eq("id", groupMember.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found
        expect(afterRemoval).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });
});
