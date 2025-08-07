import { createRLSTest } from "../helpers/rls-test-base";
import { createTestUser, cleanupTestUser } from "../helpers/test-data-factory";

// Database function security tests for get_user_id_by_email
const rlsTest = createRLSTest();

describe("get_user_id_by_email Function RLS Policies", () => {
  describe("Function Access Control", () => {
    it("should allow tenant owners to call get_user_id_by_email function", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, tenant } = rlsTest.getContext();

        // Create a test user in auth.users that we can look up
        const testUser = await createTestUser();

        try {
          // Owner should be able to call the function
          const { data, error } = await owner.client.rpc("get_user_id_by_email", {
            p_email: testUser.email,
            p_tenant_id: tenant.id,
          });

          expect(error).toBeNull();
          expect(data).toBe(testUser.id);
        } finally {
          await cleanupTestUser(testUser.id);
        }
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent regular members from calling get_user_id_by_email function", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member, tenant } = rlsTest.getContext();

        // Create a test user in auth.users that we can look up
        const testUser = await createTestUser();

        try {
          // Regular member should get access denied
          const { data, error } = await member.client.rpc("get_user_id_by_email", {
            p_email: testUser.email,
            p_tenant_id: tenant.id,
          });

          expect(error).toBeDefined();
          expect(error.code).toBe("P0001"); // PostgreSQL RAISE EXCEPTION error code
          expect(error.message).toContain("Access denied: Only tenant owners can look up users");
          expect(data).toBeNull();
        } finally {
          await cleanupTestUser(testUser.id);
        }
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent outsiders from calling get_user_id_by_email function", async () => {
      await rlsTest.setupTestContext();

      try {
        const { outsider, tenant } = rlsTest.getContext();

        // Create a test user in auth.users that we can look up
        const testUser = await createTestUser();

        try {
          // Outsider should get access denied
          const { data, error } = await outsider.client.rpc("get_user_id_by_email", {
            p_email: testUser.email,
            p_tenant_id: tenant.id,
          });

          expect(error).toBeDefined();
          expect(error.code).toBe("P0001"); // PostgreSQL RAISE EXCEPTION error code
          expect(error.message).toContain("Access denied: Only tenant owners can look up users");
          expect(data).toBeNull();
        } finally {
          await cleanupTestUser(testUser.id);
        }
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should return null for non-existent users when called by owner", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner, tenant } = rlsTest.getContext();

        // Use a fake email that doesn't exist
        const fakeEmail = `nonexistent-${Date.now()}@example.com`;

        // Owner should be able to call the function but get null result
        const { data, error } = await owner.client.rpc("get_user_id_by_email", {
          p_email: fakeEmail,
          p_tenant_id: tenant.id,
        });

        expect(error).toBeNull();
        expect(data).toBeNull(); // Function should return null for non-existent users
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent cross-tenant access - owner of different tenant cannot call function", async () => {
      // This test ensures tenant owners can only use the function for their own tenant
      await rlsTest.setupTestContext();

      // Create a second tenant context
      const rlsTest2 = createRLSTest();
      await rlsTest2.setupTestContext();

      try {
        const { owner: owner1 } = rlsTest.getContext();
        const { tenant: tenant2 } = rlsTest2.getContext();

        // Create a test user
        const testUser = await createTestUser();

        try {
          // Owner of tenant1 should NOT be able to call function with tenant2.id
          const { data, error } = await owner1.client.rpc("get_user_id_by_email", {
            p_email: testUser.email,
            p_tenant_id: tenant2.id, // Different tenant ID
          });

          expect(error).toBeDefined();
          expect(error.code).toBe("P0001"); // Access denied
          expect(error.message).toContain("Access denied: Only tenant owners can look up users");
          expect(data).toBeNull();
        } finally {
          await cleanupTestUser(testUser.id);
        }
      } finally {
        await rlsTest.cleanupTestContext();
        await rlsTest2.cleanupTestContext();
      }
    });
  });
});
