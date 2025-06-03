import { createRLSTest } from "../helpers/rls-test-base";
import { createTestGroup, getDefaultPriceTier } from "../helpers/test-data-factory";

// Standard CRUD tests generated automatically using the new base class
const rlsTest = createRLSTest();

rlsTest.createStandardRLSTestSuite({
  entityName: "Group",
  tableName: "groups",
  createEntityFn: createTestGroup,
  additionalEntityData: {
    description: "Test group for RLS testing",
  },
});

// Custom tests for specific business logic (like group limits) can still be written individually
describe("Groups RLS Policies - Custom Tests", () => {
  it("should enforce tenant group limit when creating groups", async () => {
    await rlsTest.setupTestContext();

    try {
      const { owner, tenant } = rlsTest.getContext();
      const defaultTier = await getDefaultPriceTier();

      // Create groups up to the limit (defaultTier.group_limit is 5)
      for (let i = 0; i < defaultTier!.group_limit; i++) {
        const { data, error } = await owner.client
          .from("groups")
          .insert({
            tenant_id: tenant.id,
            name: `Group ${i + 1}`,
            description: `Test group ${i + 1}`,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
      }

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
      await rlsTest.cleanupTestContext();
    }
  });

  it("should allow tenant members to view groups in their tenant", async () => {
    await rlsTest.setupTestContext();

    try {
      const { tenant } = rlsTest.getContext();
      const group = await createTestGroup(tenant.id);

      // Test both owner and member can view
      await rlsTest.testTenantMemberCanView("groups", group.id, "owner");
      await rlsTest.testTenantMemberCanView("groups", group.id, "member");
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  it("should prevent outsiders from viewing groups", async () => {
    await rlsTest.setupTestContext();

    try {
      const { tenant } = rlsTest.getContext();
      const group = await createTestGroup(tenant.id);

      await rlsTest.testOutsiderCannotView("groups", group.id);
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  it("should allow tenant owners to add members to groups", async () => {
    await rlsTest.setupTestContext();

    try {
      const { owner, member, tenant } = rlsTest.getContext();
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
      await rlsTest.cleanupTestContext();
    }
  });

  it("should prevent non-owners from adding members to groups", async () => {
    await rlsTest.setupTestContext();

    try {
      const { member, outsider, tenant } = rlsTest.getContext();
      const group = await createTestGroup(tenant.id);

      const { data, error } = await member.client
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: outsider.id,
        })
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain("new row violates row-level security policy");
      expect(data).toBeNull();
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });
});
