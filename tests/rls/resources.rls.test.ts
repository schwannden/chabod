import { describe, it, expect, beforeEach } from "@jest/globals";
import { checkTestEnvironment, serviceRoleClient, anonClient } from "../setup";
import {
  createTestUser,
  createTestTenant,
  addUserToTenant,
  createTestGroup,
  createTestResource,
  cleanupTestUser,
  cleanupTestTenant,
} from "../helpers/test-data-factory";

describe("Resources RLS Policies", () => {
  beforeEach(() => {
    checkTestEnvironment();
  });

  describe('Resource Creation Policy: "Tenant owners can insert resources"', () => {
    it("should allow tenant owners to create resources", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await owner.client
          .from("resources")
          .insert({
            tenant_id: tenant.id,
            name: "Test Resource Creation",
            description: "A test resource for creation",
            url: "https://example.com/test",
            icon: "document",
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Test Resource Creation");
        expect(data.tenant_id).toBe(tenant.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from creating resources", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        const { data, error } = await member.client
          .from("resources")
          .insert({
            tenant_id: tenant.id,
            name: "Unauthorized Resource",
            description: "Should not be created",
            url: "https://example.com/unauthorized",
            icon: "document",
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

    it("should prevent users outside the tenant from creating resources", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { data, error } = await outsider.client
          .from("resources")
          .insert({
            tenant_id: tenant.id,
            name: "Outsider Resource",
            description: "Should not be created",
            url: "https://example.com/outsider",
            icon: "document",
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
        await cleanupTestUser(outsider.id);
      }
    });

    it("should reject unauthenticated users from creating resources", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const { error } = await anonClient.from("resources").insert({
          tenant_id: tenant.id,
          name: "Unauthenticated Resource",
          description: "Should not be created",
          url: "https://example.com/unauth",
          icon: "document",
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

  describe('Resource Update Policy: "Tenant owners can update resources"', () => {
    it("should allow tenant owners to update their resources", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);

        const { data, error } = await owner.client
          .from("resources")
          .update({
            name: "Updated Resource Name",
            description: "Updated description",
            url: "https://example.com/updated",
          })
          .eq("id", resource.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Updated Resource Name");
        expect(data.description).toBe("Updated description");
        expect(data.url).toBe("https://example.com/updated");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from updating resources", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const resource = await createTestResource(tenant.id);

        const { data, error } = await member.client
          .from("resources")
          .update({ name: "Unauthorized Update" })
          .eq("id", resource.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from updating resources", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);

        const { data, error } = await outsider.client
          .from("resources")
          .update({ name: "Outsider Update" })
          .eq("id", resource.id)
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

  describe('Resource Delete Policy: "Tenant owners can delete resources"', () => {
    it("should allow tenant owners to delete their resources", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);

        const { error } = await owner.client.from("resources").delete().eq("id", resource.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from deleting resources", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const resource = await createTestResource(tenant.id);

        const { data, error } = await member.client
          .from("resources")
          .delete()
          .eq("id", resource.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify resource still exists
        const { data: stillExists } = await serviceRoleClient
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from deleting resources", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);

        const { data, error } = await outsider.client
          .from("resources")
          .delete()
          .eq("id", resource.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify resource still exists
        const { data: stillExists } = await serviceRoleClient
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Resource Select Policy: "Tenant members can view resources"', () => {
    it("should allow tenant members to view resources in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const resource = await createTestResource(tenant.id);

        // Owner should see the resource
        const { data: ownerData, error: ownerError } = await owner.client
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(ownerError).toBeNull();
        expect(ownerData).toBeDefined();
        expect(ownerData.id).toBe(resource.id);

        // Member should see the resource
        const { data: memberData, error: memberError } = await member.client
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberData).toBeDefined();
        expect(memberData.id).toBe(resource.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from viewing resources", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);

        const { data, error } = await outsider.client
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });

    it("should prevent unauthenticated users from viewing resources", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);

        const { data, error } = await anonClient
          .from("resources")
          .select("*")
          .eq("id", resource.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });

  describe('Resource-Group Association Creation Policy: "Tenant owners can insert resource-group associations"', () => {
    it("should allow tenant owners to create resource-group associations", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        const { data, error } = await owner.client
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.resource_id).toBe(resource.id);
        expect(data.group_id).toBe(group.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from creating resource-group associations", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        const { data, error } = await member.client
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
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

    it("should prevent users outside the tenant from creating resource-group associations", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        const { data, error } = await outsider.client
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
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
        await cleanupTestUser(outsider.id);
      }
    });

    it("should prevent duplicate resource-group associations", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Create association first time
        const { error: firstError } = await owner.client.from("resources_groups").insert({
          resource_id: resource.id,
          group_id: group.id,
        });

        expect(firstError).toBeNull();

        // Try to create same association again
        const { data, error } = await owner.client
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("duplicate key value violates unique constraint");
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });

  describe('Resource-Group Association Update/Delete Policy: "Tenant owners can manage resource-group associations"', () => {
    it("should allow tenant owners to delete resource-group associations", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Create association first
        const { data: association } = await serviceRoleClient
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select()
          .single();

        // Owner should be able to delete association
        const { error } = await owner.client
          .from("resources_groups")
          .delete()
          .eq("id", association!.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("resources_groups")
          .select("*")
          .eq("id", association!.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent non-owners from deleting resource-group associations", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Create association
        const { data: association } = await serviceRoleClient
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select()
          .single();

        // Member should not be able to delete association
        const { data, error } = await member.client
          .from("resources_groups")
          .delete()
          .eq("id", association!.id)
          .select();

        // Should return empty array (no rows deleted) due to RLS policy
        expect(data).toEqual([]);

        // Verify association still exists
        const { data: stillExists } = await serviceRoleClient
          .from("resources_groups")
          .select("*")
          .eq("id", association!.id)
          .single();

        expect(stillExists).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });
  });

  describe('Resource-Group Association Select Policy: "Tenant members can view resource-group associations"', () => {
    it("should allow tenant members to view resource-group associations in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Create association
        const { data: association } = await serviceRoleClient
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select()
          .single();

        // Both owner and member should be able to view association
        const { data: ownerData, error: ownerError } = await owner.client
          .from("resources_groups")
          .select("*")
          .eq("id", association!.id)
          .single();

        expect(ownerError).toBeNull();
        expect(ownerData).toBeDefined();

        const { data: memberData, error: memberError } = await member.client
          .from("resources_groups")
          .select("*")
          .eq("id", association!.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberData).toBeDefined();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent users outside the tenant from viewing resource-group associations", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Create association
        const { data: association } = await serviceRoleClient
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select()
          .single();

        // Outsider should not be able to view association
        const { data, error } = await outsider.client
          .from("resources_groups")
          .select("*")
          .eq("id", association!.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });

    it("should prevent unauthenticated users from viewing resource-group associations", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        const resource = await createTestResource(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Create association
        const { data: association } = await serviceRoleClient
          .from("resources_groups")
          .insert({
            resource_id: resource.id,
            group_id: group.id,
          })
          .select()
          .single();

        // Unauthenticated user should not be able to view association
        const { data, error } = await anonClient
          .from("resources_groups")
          .select("*")
          .eq("id", association!.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found due to RLS
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });
});
