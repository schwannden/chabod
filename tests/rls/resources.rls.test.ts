import { createRLSTest } from "../helpers/rls-test-base";
import { createTestResource } from "../helpers/test-data-factory";

// Standard CRUD tests generated automatically using the new base class
const rlsTest = createRLSTest();

rlsTest.createStandardRLSTestSuite({
  entityName: "Resource",
  tableName: "resources",
  createEntityFn: createTestResource,
  additionalEntityData: {
    description: "Test resource for RLS testing",
    url: "https://example.com/test",
    icon: "document",
  },
});

// Custom tests for resource-specific business logic
describe("Resources RLS Policies - Custom Tests", () => {
  it("should allow tenant members to view resources in their tenant", async () => {
    await rlsTest.setupTestContext();

    try {
      const { tenant } = rlsTest.getContext();
      const resource = await createTestResource(tenant.id);

      // Test both owner and member can view
      await rlsTest.testTenantMemberCanView("resources", resource.id, "owner");
      await rlsTest.testTenantMemberCanView("resources", resource.id, "member");
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  it("should prevent outsiders from viewing resources", async () => {
    await rlsTest.setupTestContext();

    try {
      const { tenant } = rlsTest.getContext();
      const resource = await createTestResource(tenant.id);

      await rlsTest.testOutsiderCannotView("resources", resource.id);
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  it("should allow updating resource with custom validation", async () => {
    await rlsTest.setupTestContext();

    try {
      const { owner, tenant } = rlsTest.getContext();
      const resource = await createTestResource(tenant.id, {
        name: "Original Resource Name",
        url: "https://original.example.com",
      });

      // Test updating specific fields
      const { data, error } = await owner.client
        .from("resources")
        .update({
          name: "Updated Resource Name",
          url: "https://updated.example.com",
          description: "Updated description",
        })
        .eq("id", resource.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe("Updated Resource Name");
      expect(data.url).toBe("https://updated.example.com");
      expect(data.description).toBe("Updated description");
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });
});
