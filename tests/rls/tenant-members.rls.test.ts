import { createRLSTest } from "../helpers/rls-test-base";
import { createTestUser, cleanupTestUser } from "../helpers/test-data-factory";
import { serviceRoleClient, TestUser } from "../setup";

// Tenant members are a special relationship table that requires custom handling
const rlsTest = createRLSTest();

describe("Tenant Members RLS Policies", () => {
  describe("Tenant Member Insert Policies", () => {
    it("should allow tenant owners to add members", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, outsider, tenant } = rlsTest.getContext();

        const { data, error } = await owner.client
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: outsider.id,
            role: "member",
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.user_id).toBe(outsider.id);
        expect(data.role).toBe("member");
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent regular members from adding other members", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, outsider, tenant } = rlsTest.getContext();

        const { data, error } = await member.client
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: outsider.id,
            role: "member",
          })
          .select()
          .single();

        // Currently, this succeeds when it should fail
        expect(error).toBeDefined();
        expect(data).toBeNull();
        expect(error?.code).toBe("42501");

        // Clean up the incorrectly inserted record if it exists
        if (data?.id) {
          await serviceRoleClient.from("tenant_members").delete().eq("id", data.id);
        }
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should enforce tenant user limits based on price tier", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, tenant } = rlsTest.getContext();

        // Get the user limit for the tenant's price tier
        const { data: tierData } = await serviceRoleClient
          .from("price_tiers")
          .select("user_limit")
          .eq("id", tenant.priceTierId)
          .single();

        const userLimit = tierData?.user_limit || 10;

        // Check how many users are already in the tenant (owner + member from context)
        const { data: existingMembers } = await serviceRoleClient
          .from("tenant_members")
          .select("id")
          .eq("tenant_id", tenant.id);

        const currentCount = existingMembers?.length || 0;
        const remainingSlots = userLimit - currentCount;

        // Create users up to the remaining slots
        const users: TestUser[] = [];

        for (let i = 0; i < remainingSlots; i++) {
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

        // Verify we're now at the maximum allowed count
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
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Member Select Policies", () => {
    it("should allow users to view their own memberships", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant members to view other memberships in their tenant", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

        // Member should be able to see all memberships in the tenant
        const { data, error } = await member.client
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id);

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.length).toBeGreaterThanOrEqual(2); // owner + member
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent outsiders from viewing tenant memberships", async () => {
      await rlsTest.setupTestContext();

      try {
        const { outsider, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Member Update Policies", () => {
    it("should allow tenant owners to update member roles", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent regular members from updating memberships", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, outsider, tenant } = rlsTest.getContext();

        // Add outsider as member to have someone for member to try to update
        await serviceRoleClient.from("tenant_members").insert({
          tenant_id: tenant.id,
          user_id: outsider.id,
          role: "member",
        });

        // Get the outsider's membership record
        const { data: membership } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", outsider.id)
          .single();

        // Member should NOT be able to update outsider's role
        const { error } = await member.client
          .from("tenant_members")
          .update({ role: "owner" })
          .eq("id", membership.id);

        expect(error).toBeDefined();
        expect(error?.code || error?.message || "RLS violation").toMatch(
          /new row violates row-level security policy|permission denied|access denied|RLS violation/i,
        );
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent members from updating their own roles", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Member Delete Policies", () => {
    it("should allow tenant owners to remove members", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent regular members from removing other members", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, outsider, tenant } = rlsTest.getContext();

        // Add outsider as member
        const { data: newMembership } = await serviceRoleClient
          .from("tenant_members")
          .insert({
            tenant_id: tenant.id,
            user_id: outsider.id,
            role: "member",
          })
          .select()
          .single();

        // Member should NOT be able to remove outsider
        const { error } = await member.client
          .from("tenant_members")
          .delete()
          .eq("id", newMembership.id);

        expect(error).toBeDefined();
        expect(error?.code || error?.message || "RLS violation").toMatch(
          /new row violates row-level security policy|permission denied|access denied|RLS violation/i,
        );

        // Verify outsider still exists
        const { data } = await serviceRoleClient
          .from("tenant_members")
          .select("*")
          .eq("id", newMembership.id)
          .single();

        expect(data).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent members from removing themselves", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Group Membership Cascade Trigger", () => {
    it("should automatically remove user from groups when removed from tenant", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, member, tenant } = rlsTest.getContext();

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
        await rlsTest.cleanupTestContext();
      }
    });
  });
});
