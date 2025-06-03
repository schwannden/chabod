import { describe, it, expect, beforeEach } from "@jest/globals";
import { checkTestEnvironment, serviceRoleClient, anonClient } from "../setup";
import {
  createTestUser,
  createTestTenant,
  addUserToTenant,
  createTestGroup,
  cleanupTestUser,
  cleanupTestTenant,
  getDefaultPriceTier,
} from "../helpers/test-data-factory";

describe("Groups RLS Policies", () => {
  beforeEach(() => {
    checkTestEnvironment();
  });

  describe('Group Creation Policy: "Tenant owners can manage groups" and "enforce_tenant_group_limit"', () => {
    it("should allow tenant owners to create groups", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await owner.client
          .from("groups")
          .insert({
            tenant_id: tenant.id,
            name: "Test Group Creation",
            description: "A test group for creation",
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Test Group Creation");
        expect(data.tenant_id).toBe(tenant.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from creating groups", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        const { data, error } = await member.client
          .from("groups")
          .insert({
            tenant_id: tenant.id,
            name: "Unauthorized Group",
            description: "Should not be created",
          })
          .select();

        expect(error).toBeDefined();
        if (error?.message) {
          expect(error.message).toContain("new row violates row-level security policy");
        }
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from creating groups", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await outsider.client
          .from("groups")
          .insert({
            tenant_id: tenant.id,
            name: "Outsider Group",
            description: "Should not be created",
          })
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });

    it("should enforce tenant group limit when creating groups", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);
      const defaultTier = await getDefaultPriceTier();

      try {
        // Create groups up to the limit (defaultTier.group_limit is 5)
        const groupPromises = [];
        for (let i = 0; i < defaultTier!.group_limit; i++) {
          groupPromises.push(
            owner.client
              .from("groups")
              .insert({
                tenant_id: tenant.id,
                name: `Group ${i + 1}`,
                description: `Test group ${i + 1}`,
              })
              .select()
              .single(),
          );
        }

        const results = await Promise.all(groupPromises);
        results.forEach((result) => {
          expect(result.error).toBeNull();
          expect(result.data).toBeDefined();
        });

        // Try to create one more group (should fail due to limit)
        const { data, error } = await owner.client
          .from("groups")
          .insert({
            tenant_id: tenant.id,
            name: "Over Limit Group",
            description: "Should fail due to group limit",
          })
          .select();

        expect(error).toBeDefined();
        if (error?.message) {
          expect(error.message).toContain("new row violates row-level security policy");
        }
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should reject unauthenticated users from creating groups", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { error } = await anonClient.from("groups").insert({
          tenant_id: tenant.id,
          name: "Unauthenticated Group",
          description: "Should not be created",
        });

        expect(error).toBeDefined();
        if (error?.message) {
          expect(error.message).toContain("new row violates row-level security policy");
        }
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });

  describe('Group Update Policy: "Tenant owners can manage groups"', () => {
    it("should allow tenant owners to update their groups", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const group = await createTestGroup(tenant.id);

        const { data, error } = await owner.client
          .from("groups")
          .update({
            name: "Updated Group Name",
            description: "Updated description",
          })
          .eq("id", group.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Updated Group Name");
        expect(data.description).toBe("Updated description");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from updating groups", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        const { data, error } = await member.client
          .from("groups")
          .update({ name: "Unauthorized Update" })
          .eq("id", group.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from updating groups", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const group = await createTestGroup(tenant.id);

        const { data, error } = await outsider.client
          .from("groups")
          .update({ name: "Outsider Update" })
          .eq("id", group.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Group Delete Policy: "Tenant owners can manage groups"', () => {
    it("should allow tenant owners to delete their groups", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const group = await createTestGroup(tenant.id);

        const { error } = await owner.client.from("groups").delete().eq("id", group.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from deleting groups", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        const { data, error } = await member.client
          .from("groups")
          .delete()
          .eq("id", group.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify group still exists
        const { data: stillExists } = await serviceRoleClient
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from deleting groups", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const group = await createTestGroup(tenant.id);

        const { data, error } = await outsider.client
          .from("groups")
          .delete()
          .eq("id", group.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify group still exists
        const { data: stillExists } = await serviceRoleClient
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Group Select Policy: "Users can view groups in their tenants"', () => {
    it("should allow tenant members to view groups in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Owner should see the group
        const { data: ownerData, error: ownerError } = await owner.client
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(ownerError).toBeNull();
        expect(ownerData).toBeDefined();
        expect(ownerData.id).toBe(group.id);

        // Member should see the group
        const { data: memberData, error: memberError } = await member.client
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberData).toBeDefined();
        expect(memberData.id).toBe(group.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from viewing groups", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const group = await createTestGroup(tenant.id);

        const { data, error } = await outsider.client
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });

    it("should prevent unauthenticated users from viewing groups", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const group = await createTestGroup(tenant.id);

        const { data, error } = await anonClient
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });

  describe('Group Member Creation Policy: "Tenant owners can manage group members"', () => {
    it("should allow tenant owners to add members to groups", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        const { data, error } = await owner.client
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.group_id).toBe(group.id);
        expect(data.user_id).toBe(member.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent non-owners from adding members to groups", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member1.id, tenant.id, "member");
        await addUserToTenant(member2.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        const { data, error } = await member1.client
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member2.id,
          })
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member1.id);
        await cleanupTestUser(member2.id);
      }
    });

    it("should prevent users outside the tenant from adding members to groups", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        const { data, error } = await outsider.client
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
        await cleanupTestUser(outsider.id);
      }
    });

    it("should prevent duplicate group memberships", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Add member first time
        const { error: firstError } = await owner.client.from("group_members").insert({
          group_id: group.id,
          user_id: member.id,
        });

        expect(firstError).toBeNull();

        // Try to add same member again
        const { data, error } = await owner.client
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("duplicate key value violates unique constraint");
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });

  describe('Group Member Update/Delete Policy: "Tenant owners can manage group members"', () => {
    it("should allow tenant owners to remove members from groups", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Add member to group first
        const { data: groupMember } = await serviceRoleClient
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select()
          .single();

        // Owner should be able to remove member
        const { error } = await owner.client
          .from("group_members")
          .delete()
          .eq("id", groupMember!.id);

        expect(error).toBeNull();

        // Verify removal
        const { data, error: selectError } = await serviceRoleClient
          .from("group_members")
          .select("*")
          .eq("id", groupMember!.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent non-owners from removing members from groups", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member1.id, tenant.id, "member");
        await addUserToTenant(member2.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Add member2 to group
        const { data: groupMember } = await serviceRoleClient
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member2.id,
          })
          .select()
          .single();

        // member1 should not be able to remove member2
        const { data, error } = await member1.client
          .from("group_members")
          .delete()
          .eq("id", groupMember!.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify member2 is still in group
        const { data: stillExists } = await serviceRoleClient
          .from("group_members")
          .select("*")
          .eq("id", groupMember!.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member1.id);
        await cleanupTestUser(member2.id);
      }
    });
  });

  describe('Group Member Select Policy: "Users can view group members in their tenants"', () => {
    it("should allow tenant members to view group members in their tenant", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member1.id, tenant.id, "member");
        await addUserToTenant(member2.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Add member2 to group
        const { data: groupMember } = await serviceRoleClient
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member2.id,
          })
          .select()
          .single();

        // Both owner and member1 should be able to view group membership
        const { data: ownerData, error: ownerError } = await owner.client
          .from("group_members")
          .select("*")
          .eq("id", groupMember!.id)
          .single();

        expect(ownerError).toBeNull();
        expect(ownerData).toBeDefined();

        const { data: memberData, error: memberError } = await member1.client
          .from("group_members")
          .select("*")
          .eq("id", groupMember!.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberData).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member1.id);
        await cleanupTestUser(member2.id);
      }
    });

    it("should prevent users outside the tenant from viewing group members", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Add member to group
        const { data: groupMember } = await serviceRoleClient
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select()
          .single();

        // Outsider should not be able to view group membership
        const { data, error } = await outsider.client
          .from("group_members")
          .select("*")
          .eq("id", groupMember!.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
        await cleanupTestUser(outsider.id);
      }
    });

    it("should prevent unauthenticated users from viewing group members", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group = await createTestGroup(tenant.id);

        // Add member to group
        const { data: groupMember } = await serviceRoleClient
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member.id,
          })
          .select()
          .single();

        // Unauthenticated user should not be able to view group membership
        const { data, error } = await anonClient
          .from("group_members")
          .select("*")
          .eq("id", groupMember!.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });

  describe("Group Trigger Tests", () => {
    it("should automatically remove users from all groups when removed from tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const group1 = await createTestGroup(tenant.id, { name: "Group 1" });
        const group2 = await createTestGroup(tenant.id, { name: "Group 2" });

        // Add member to both groups
        await serviceRoleClient.from("group_members").insert([
          { group_id: group1.id, user_id: member.id },
          { group_id: group2.id, user_id: member.id },
        ]);

        // Verify member is in both groups
        const { data: beforeRemoval } = await serviceRoleClient
          .from("group_members")
          .select("*")
          .eq("user_id", member.id);

        expect(beforeRemoval).toHaveLength(2);

        // Remove member from tenant (this should trigger removal from groups)
        await serviceRoleClient
          .from("tenant_members")
          .delete()
          .eq("tenant_id", tenant.id)
          .eq("user_id", member.id);

        // Verify member is removed from all groups
        const { data: afterRemoval } = await serviceRoleClient
          .from("group_members")
          .select("*")
          .eq("user_id", member.id);

        expect(afterRemoval).toHaveLength(0);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });
});
