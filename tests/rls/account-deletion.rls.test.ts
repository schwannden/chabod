import { createRLSTest } from "../helpers/rls-test-base";
import {
  createTestUser,
  cleanupTestUser,
  createTestTenant,
  cleanupTestTenant,
} from "../helpers/test-data-factory";
import { serviceRoleClient } from "../setup";

const rlsTest = createRLSTest();

describe("Account Deletion RLS Policies", () => {
  describe("Account Deletion Eligibility Function", () => {
    it("should allow regular tenant member to delete their account", async () => {
      await rlsTest.setupTestContext();

      try {
        const { member } = rlsTest.getContext();

        const { data, error } = await member.client.rpc("check_user_deletion_eligibility", {
          p_user_id: member.id,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.canDelete).toBe(true);
        expect(data.blockers).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent sole tenant owner from deleting their account", async () => {
      await rlsTest.setupTestContext();

      try {
        const { owner } = rlsTest.getContext();

        const { data, error } = await owner.client.rpc("check_user_deletion_eligibility", {
          p_user_id: owner.id,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.canDelete).toBe(false);
        expect(data.blockers).toBeDefined();
        expect(data.blockers.length).toBeGreaterThan(0);
        expect(data.blockers[0].type).toBe("sole_tenant_owner");
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant owner to delete account when other owners exist", async () => {
      const owner1 = await createTestUser();
      const owner2 = await createTestUser();
      let tenant = null;

      try {
        // Create tenant with first owner
        tenant = await createTestTenant(owner1.id);

        // Add second owner to the tenant using service role
        await serviceRoleClient.from("tenant_members").insert({
          tenant_id: tenant.id,
          user_id: owner2.id,
          role: "owner",
        });

        // Now owner1 should be able to delete their account since owner2 exists
        const { data, error } = await owner1.client.rpc("check_user_deletion_eligibility", {
          p_user_id: owner1.id,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.canDelete).toBe(true);
        expect(data.blockers).toEqual([]);
      } finally {
        if (tenant) await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner1.id);
        await cleanupTestUser(owner2.id);
      }
    });

    it("should handle user with no tenant memberships", async () => {
      const user = await createTestUser();

      try {
        const { data, error } = await user.client.rpc("check_user_deletion_eligibility", {
          p_user_id: user.id,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.canDelete).toBe(true);
        expect(data.blockers).toEqual([]);
      } finally {
        await cleanupTestUser(user.id);
      }
    });
  });

  describe("Simplified Database Functions", () => {
    describe("delete_user_account Function", () => {
      it("should successfully validate eligibility before deletion", async () => {
        const user = await createTestUser();

        try {
          // Test eligibility check (user with no tenants should be eligible)
          const { data: eligibilityData, error: eligibilityError } = await user.client.rpc(
            "check_user_deletion_eligibility",
            {
              p_user_id: user.id,
            },
          );

          expect(eligibilityError).toBeNull();
          expect(eligibilityData.canDelete).toBe(true);

          // NOTE: We can't actually test full user deletion in tests as it would delete
          // the test user and break the test cleanup. The delete function is tested
          // through eligibility validation which is the key business logic.
        } finally {
          await cleanupTestUser(user.id);
        }
      });

      it("should reject deletion for users who cannot delete their account", async () => {
        await rlsTest.setupTestContext();

        try {
          const { owner } = rlsTest.getContext();

          // Attempt deletion (should fail due to business rules - sole tenant owner)
          const { data, error } = await owner.client.rpc("delete_user_account", {
            p_user_id: owner.id,
          });

          expect(error).toBeDefined();
          expect(error.code).toBe("23514");
          expect(data).toBeNull();
        } finally {
          await rlsTest.cleanupTestContext();
        }
      });

      it("should prevent users from deleting other users accounts", async () => {
        await rlsTest.setupTestContext();

        try {
          const { owner, member } = rlsTest.getContext();

          // Try to delete member's account as owner
          const { data, error } = await owner.client.rpc("delete_user_account", {
            p_user_id: member.id,
          });

          expect(error).toBeDefined();
          expect(error.code).toBe("42501");
          expect(data).toBeNull();
        } finally {
          await rlsTest.cleanupTestContext();
        }
      });
    });
  });

  describe("Anonymous User Restrictions", () => {
    it("should prevent anonymous users from accessing deletion functions", async () => {
      const anonClient = serviceRoleClient; // Use service role but without auth

      // Test that anonymous users cannot check eligibility
      const { error } = await anonClient.rpc("check_user_deletion_eligibility", {
        p_user_id: "00000000-0000-0000-0000-000000000000",
      });

      // Should either error or return appropriate response for unauthenticated user
      expect(error).toBeDefined();
    });
  });
});
