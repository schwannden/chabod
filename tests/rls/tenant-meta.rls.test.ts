import { createRLSTest } from "../helpers/rls-test-base";
import { serviceRoleClient, anonClient } from "../setup";

const rlsTest = createRLSTest();

describe("Tenant Meta RLS Policies", () => {
  beforeEach(async () => {
    await rlsTest.setupTestContext();
  });

  afterEach(async () => {
    await rlsTest.cleanupTestContext();
  });

  describe("Tenant Meta Select Policy", () => {
    it("should allow tenant owners to read tenant meta", async () => {
      try {
        const { owner, tenant } = rlsTest.getContext();

        const { data, error } = await owner.client
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].tenant_id).toBe(tenant.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant members to read tenant meta", async () => {
      try {
        const { member, tenant } = rlsTest.getContext();

        const { data, error } = await member.client
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        // Members should be able to read tenant meta
        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].tenant_id).toBe(tenant.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow outsiders to read tenant meta", async () => {
      try {
        const { outsider, tenant } = rlsTest.getContext();

        const { data, error } = await outsider.client
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        // Outsiders should be able to read tenant meta
        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].tenant_id).toBe(tenant.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow anonymous users to read tenant meta", async () => {
      try {
        const { tenant } = rlsTest.getContext();

        // Use the imported anonymous client

        const { data, error } = await anonClient
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        // Anonymous users should be able to read tenant meta
        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].tenant_id).toBe(tenant.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Meta Update Policy", () => {
    it("should allow tenant owners to update tenant meta", async () => {
      try {
        const { owner, tenant } = rlsTest.getContext();

        const updateData = {
          website: "https://example-church.com",
          phone_number: "+1-555-0123",
          tax_id: "12345678",
        };

        const { data, error } = await owner.client
          .from("tenant_meta")
          .update(updateData)
          .eq("tenant_id", tenant.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.website).toBe(updateData.website);
        expect(data.phone_number).toBe(updateData.phone_number);
        expect(data.tax_id).toBe(updateData.tax_id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent tenant members from updating tenant meta", async () => {
      try {
        const { member, tenant } = rlsTest.getContext();

        const { data, error: _error } = await member.client
          .from("tenant_meta")
          .update({ website: "https://hacker.com" })
          .eq("tenant_id", tenant.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent outsiders from updating tenant meta", async () => {
      try {
        const { outsider, tenant } = rlsTest.getContext();

        const { data, error: _error } = await outsider.client
          .from("tenant_meta")
          .update({ website: "https://malicious.com" })
          .eq("tenant_id", tenant.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Meta Automatic Creation", () => {
    it("should automatically create tenant meta when tenant is created", async () => {
      try {
        const { owner: _owner } = rlsTest.getContext();

        // Verify that tenant meta was automatically created for the test tenant
        // The createRLSTest() creates a tenant, which should trigger the metadata creation
        const { data: existingMeta, error: selectError } = await serviceRoleClient
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", rlsTest.getContext().tenant.id)
          .single();

        expect(selectError).toBeNull();
        expect(existingMeta).toBeDefined();
        expect(existingMeta.tenant_id).toBe(rlsTest.getContext().tenant.id);
        expect(existingMeta.contact_email).toBe(""); // Empty default
        expect(existingMeta.address).toBe(""); // Empty default
        expect(existingMeta.verified).toBe(false); // Default false
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Tenant Meta Cascade Delete", () => {
    it("should cascade delete tenant meta when tenant is deleted", async () => {
      try {
        const { tenant } = rlsTest.getContext();

        // Verify meta exists before deletion
        const { data: beforeData, error: beforeError } = await serviceRoleClient
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        expect(beforeError).toBeNull();
        expect(beforeData).toHaveLength(1);

        // Delete the tenant using service role
        const { error: deleteError } = await serviceRoleClient
          .from("tenants")
          .delete()
          .eq("id", tenant.id);

        expect(deleteError).toBeNull();

        // Verify meta was cascade deleted
        const { data: afterData, error: afterError } = await serviceRoleClient
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        expect(afterError).toBeNull();
        expect(afterData).toHaveLength(0);
      } finally {
        // Skip standard cleanup since we deleted the tenant in the test
        // Manual cleanup of users
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
  });

  describe("Tenant Meta Verification Features", () => {
    it("should allow owners to update verification status", async () => {
      try {
        const { owner, tenant } = rlsTest.getContext();

        const { data, error } = await owner.client
          .from("tenant_meta")
          .update({
            verified: true,
            verified_time: new Date().toISOString(),
          })
          .eq("tenant_id", tenant.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.verified).toBe(true);
        expect(data.verified_time).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow owners to update contact information", async () => {
      try {
        const { owner, tenant } = rlsTest.getContext();

        const contactData = {
          contact_email: "admin@church.com",
          address: "123 Church St, City, State 12345",
        };

        const { data, error } = await owner.client
          .from("tenant_meta")
          .update(contactData)
          .eq("tenant_id", tenant.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.contact_email).toBe(contactData.contact_email);
        expect(data.address).toBe(contactData.address);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Service Role Access", () => {
    it("should allow service role to read all tenant meta", async () => {
      try {
        const { tenant } = rlsTest.getContext();

        const { data, error } = await serviceRoleClient
          .from("tenant_meta")
          .select("*")
          .eq("tenant_id", tenant.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].tenant_id).toBe(tenant.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow service role to update tenant meta", async () => {
      try {
        const { tenant } = rlsTest.getContext();

        const { data, error } = await serviceRoleClient
          .from("tenant_meta")
          .update({ verified: true })
          .eq("tenant_id", tenant.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.verified).toBe(true);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });
});
