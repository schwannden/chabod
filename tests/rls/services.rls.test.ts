import { createRLSTest } from "../helpers/rls-test-base";
import {
  createTestGroup,
  createTestUser,
  createTestTenant,
  cleanupTestUser,
  cleanupTestTenant,
} from "../helpers/test-data-factory";
import { anonClient, serviceRoleClient } from "../setup";

const rlsTest = createRLSTest();

// Helper functions to create test data for services-related entities
const createTestService = async (
  tenantId: string,
  overrides: Partial<{
    name: string;
    default_start_time: string;
    default_end_time: string;
  }> = {},
) => {
  const uniqueId = Date.now().toString();
  const name = overrides.name || `Test Service ${uniqueId}`;

  const { data: service, error } = await serviceRoleClient
    .from("services")
    .insert({
      tenant_id: tenantId,
      name,
      default_start_time: overrides.default_start_time || "09:00:00",
      default_end_time: overrides.default_end_time || "10:00:00",
    })
    .select()
    .single();

  if (error) throw new Error(`Service creation failed: ${error.message}`);
  return service;
};

const createTestServiceRole = async (
  tenantId: string,
  serviceId: string,
  overrides: Partial<{
    name: string;
    description: string;
  }> = {},
) => {
  const uniqueId = Date.now().toString();
  const name = overrides.name || `Test Role ${uniqueId}`;

  const { data: role, error } = await serviceRoleClient
    .from("service_roles")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      name,
      description: overrides.description || `Test role description ${uniqueId}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Service role creation failed: ${error.message}`);
  return role;
};

const createTestServiceNote = async (
  tenantId: string,
  serviceId: string,
  overrides: Partial<{
    text: string;
    link: string;
  }> = {},
) => {
  const uniqueId = Date.now().toString();
  const text = overrides.text || `Test note ${uniqueId}`;

  const { data: note, error } = await serviceRoleClient
    .from("service_notes")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      text,
      link: overrides.link || `https://test-${uniqueId}.com`,
    })
    .select()
    .single();

  if (error) throw new Error(`Service note creation failed: ${error.message}`);
  return note;
};

const createTestServiceEvent = async (
  tenantId: string,
  serviceId: string,
  overrides: Partial<{
    subtitle: string;
    date: string;
    start_time: string;
    end_time: string;
  }> = {},
) => {
  const uniqueId = Date.now().toString();
  const today = new Date().toISOString().split("T")[0];

  const { data: event, error } = await serviceRoleClient
    .from("service_events")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      subtitle: overrides.subtitle || `Test Event ${uniqueId}`,
      date: overrides.date || today,
      start_time: overrides.start_time || "14:00:00",
      end_time: overrides.end_time || "15:00:00",
    })
    .select()
    .single();

  if (error) throw new Error(`Service event creation failed: ${error.message}`);
  return event;
};

// Standard RLS tests for services table
rlsTest.createStandardRLSTestSuite({
  entityName: "Service",
  tableName: "services",
  createEntityFn: createTestService,
});

describe("Services RLS Policies - Custom Tests", () => {
  describe("Service Admins Table", () => {
    it("should allow tenant owners to assign service admins", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, tenant } = rlsTest.getContext();

        // Create a service first
        const service = await createTestService(tenant.id);

        // Assign member as service admin
        const { data, error } = await owner.client
          .from("service_admins")
          .insert({
            service_id: service.id,
            user_id: member.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.service_id).toBe(service.id);
        expect(data.user_id).toBe(member.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent non-owners from assigning service admins", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, outsider, tenant } = rlsTest.getContext();

        // Create a service first
        const service = await createTestService(tenant.id);

        // Try to assign service admin as member (should fail)
        const { data, error } = await member.client
          .from("service_admins")
          .insert({
            service_id: service.id,
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

    it("should allow tenant members to view service admins", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, tenant } = rlsTest.getContext();

        // Create service and assign admin
        const service = await createTestService(tenant.id);

        const { data: serviceAdmin } = await owner.client
          .from("service_admins")
          .insert({
            service_id: service.id,
            user_id: member.id,
          })
          .select()
          .single();

        // Test that both owner and member can view service admins
        const { data: ownerView, error: ownerError } = await owner.client
          .from("service_admins")
          .select("*")
          .eq("id", serviceAdmin.id)
          .single();

        expect(ownerError).toBeNull();
        expect(ownerView).toBeDefined();

        const { data: memberView, error: memberError } = await member.client
          .from("service_admins")
          .select("*")
          .eq("id", serviceAdmin.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberView).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent outsiders from viewing service admins", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, outsider, tenant } = rlsTest.getContext();

        // Create service and assign admin
        const service = await createTestService(tenant.id);

        const { data: serviceAdmin } = await owner.client
          .from("service_admins")
          .insert({
            service_id: service.id,
            user_id: member.id,
          })
          .select()
          .single();

        // Outsider should not be able to view
        const { data } = await outsider.client
          .from("service_admins")
          .select("*")
          .eq("id", serviceAdmin.id);

        expect(data).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Service Groups Table", () => {
    it("should allow tenant owners to associate groups with services", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, tenant } = rlsTest.getContext();

        // Create service and group
        const service = await createTestService(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Associate group with service
        const { data, error } = await owner.client
          .from("service_groups")
          .insert({
            service_id: service.id,
            group_id: group.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.service_id).toBe(service.id);
        expect(data.group_id).toBe(group.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent non-owners from managing service groups", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service and group
        const service = await createTestService(tenant.id);
        const group = await createTestGroup(tenant.id);

        // Try to associate as member (should fail)
        const { data, error } = await member.client
          .from("service_groups")
          .insert({
            service_id: service.id,
            group_id: group.id,
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

  describe("Service Roles Table", () => {
    it("should allow tenant owners to create service roles", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, tenant } = rlsTest.getContext();

        // Create service first
        const service = await createTestService(tenant.id);

        // Create service role data and insert as owner
        const uniqueId = Date.now().toString();
        const roleData = {
          tenant_id: tenant.id,
          service_id: service.id,
          name: `Test Role ${uniqueId}`,
          description: `Test role description ${uniqueId}`,
        };

        const { data, error } = await owner.client
          .from("service_roles")
          .insert(roleData)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe(roleData.name);
        expect(data.service_id).toBe(service.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent non-owners from creating service roles", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service first
        const service = await createTestService(tenant.id);

        // Create service role data but try to insert as member
        const uniqueId = Date.now().toString();
        const roleData = {
          tenant_id: tenant.id,
          service_id: service.id,
          name: `Test Role ${uniqueId}`,
          description: `Test role description ${uniqueId}`,
        };

        const { data, error } = await member.client.from("service_roles").insert(roleData).select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant members to view service roles", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service and role
        const service = await createTestService(tenant.id);
        const role = await createTestServiceRole(tenant.id, service.id);

        // Both owner and member should be able to view
        const { data: memberView, error: memberError } = await member.client
          .from("service_roles")
          .select("*")
          .eq("id", role.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberView).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Service Notes Table", () => {
    it("should allow tenant owners to create service notes", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, tenant } = rlsTest.getContext();

        // Create service first
        const service = await createTestService(tenant.id);

        // Create service note data and insert as owner
        const uniqueId = Date.now().toString();
        const noteData = {
          tenant_id: tenant.id,
          service_id: service.id,
          text: `Test note ${uniqueId}`,
          link: `https://test-${uniqueId}.com`,
        };

        const { data, error } = await owner.client
          .from("service_notes")
          .insert(noteData)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.text).toBe(noteData.text);
        expect(data.service_id).toBe(service.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow service admins to create service notes", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, tenant } = rlsTest.getContext();

        // Create service and assign member as admin
        const service = await createTestService(tenant.id);

        await owner.client.from("service_admins").insert({
          service_id: service.id,
          user_id: member.id,
        });

        // Service admin should be able to create notes
        const uniqueId = Date.now().toString();
        const noteData = {
          tenant_id: tenant.id,
          service_id: service.id,
          text: `Test note ${uniqueId}`,
          link: `https://test-${uniqueId}.com`,
        };

        const { data, error } = await member.client
          .from("service_notes")
          .insert(noteData)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.text).toBe(noteData.text);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent non-admin members from creating service notes", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service but don't make member an admin
        const service = await createTestService(tenant.id);

        // Try to create note as regular member (should fail)
        const uniqueId = Date.now().toString();
        const noteData = {
          tenant_id: tenant.id,
          service_id: service.id,
          text: `Test note ${uniqueId}`,
          link: `https://test-${uniqueId}.com`,
        };

        const { data, error } = await member.client.from("service_notes").insert(noteData).select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant members to view service notes", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service and note
        const service = await createTestService(tenant.id);
        const note = await createTestServiceNote(tenant.id, service.id);

        // Member should be able to view
        const { data: memberView, error: memberError } = await member.client
          .from("service_notes")
          .select("*")
          .eq("id", note.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberView).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Service Events Table", () => {
    it("should allow tenant owners to create service events", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, tenant } = rlsTest.getContext();

        // Create service first
        const service = await createTestService(tenant.id);

        // Create service event data and insert as owner
        const uniqueId = Date.now().toString();
        const today = new Date().toISOString().split("T")[0];
        const eventData = {
          tenant_id: tenant.id,
          service_id: service.id,
          subtitle: `Test Event ${uniqueId}`,
          date: today,
          start_time: "14:00:00",
          end_time: "15:00:00",
        };

        const { data, error } = await owner.client
          .from("service_events")
          .insert(eventData)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.service_id).toBe(service.id);
        expect(data.date).toBe(eventData.date);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow service admins to create service events", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, tenant } = rlsTest.getContext();

        // Create service and assign member as admin
        const service = await createTestService(tenant.id);

        await owner.client.from("service_admins").insert({
          service_id: service.id,
          user_id: member.id,
        });

        // Service admin should be able to create events
        const uniqueId = Date.now().toString();
        const today = new Date().toISOString().split("T")[0];
        const eventData = {
          tenant_id: tenant.id,
          service_id: service.id,
          subtitle: `Test Event ${uniqueId}`,
          date: today,
          start_time: "14:00:00",
          end_time: "15:00:00",
        };

        const { data, error } = await member.client
          .from("service_events")
          .insert(eventData)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.service_id).toBe(service.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent non-admin members from creating service events", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service but don't make member an admin
        const service = await createTestService(tenant.id);

        // Try to create event as regular member (should fail)
        const uniqueId = Date.now().toString();
        const today = new Date().toISOString().split("T")[0];
        const eventData = {
          tenant_id: tenant.id,
          service_id: service.id,
          subtitle: `Test Event ${uniqueId}`,
          date: today,
          start_time: "14:00:00",
          end_time: "15:00:00",
        };

        const { data, error } = await member.client
          .from("service_events")
          .insert(eventData)
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant members to view service events", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, tenant } = rlsTest.getContext();

        // Create service and event
        const service = await createTestService(tenant.id);
        const event = await createTestServiceEvent(tenant.id, service.id);

        // Member should be able to view
        const { data: memberView, error: memberError } = await member.client
          .from("service_events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberView).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Service Event Owners Table", () => {
    it("should allow tenant owners to assign service event owners", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, tenant } = rlsTest.getContext();

        // Create service, role, and event
        const service = await createTestService(tenant.id);
        const role = await createTestServiceRole(tenant.id, service.id);
        const event = await createTestServiceEvent(tenant.id, service.id);

        // Assign member to service event role
        const { data, error } = await owner.client
          .from("service_event_owners")
          .insert({
            tenant_id: tenant.id,
            service_event_id: event.id,
            user_id: member.id,
            service_role_id: role.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.service_event_id).toBe(event.id);
        expect(data.user_id).toBe(member.id);
        expect(data.service_role_id).toBe(role.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow service admins to assign service event owners", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, outsider, tenant } = rlsTest.getContext();

        // Create service and assign member as admin
        const service = await createTestService(tenant.id);

        await owner.client.from("service_admins").insert({
          service_id: service.id,
          user_id: member.id,
        });

        // Create role and event as owner
        const role = await createTestServiceRole(tenant.id, service.id);
        const event = await createTestServiceEvent(tenant.id, service.id);

        // Add outsider to tenant as member first
        await owner.client.from("tenant_members").insert({
          tenant_id: tenant.id,
          user_id: outsider.id,
          role: "member",
        });

        // Service admin should be able to assign service event owners
        const { data, error } = await member.client
          .from("service_event_owners")
          .insert({
            tenant_id: tenant.id,
            service_event_id: event.id,
            user_id: outsider.id,
            service_role_id: role.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.service_event_id).toBe(event.id);
        expect(data.user_id).toBe(outsider.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent non-admin members from assigning service event owners", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member, outsider, tenant } = rlsTest.getContext();

        // Create service but don't make member an admin
        const service = await createTestService(tenant.id);
        const role = await createTestServiceRole(tenant.id, service.id);
        const event = await createTestServiceEvent(tenant.id, service.id);

        // Try to assign as regular member (should fail)
        const { data, error } = await member.client
          .from("service_event_owners")
          .insert({
            tenant_id: tenant.id,
            service_event_id: event.id,
            user_id: outsider.id,
            service_role_id: role.id,
          })
          .select();

        expect(error).toBeDefined();
        expect(error?.message).toContain("new row violates row-level security policy");
        expect(data).toBeNull();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should allow tenant members to view service event owners", async () => {
      await rlsTest.setupTestContext();
      try {
        const { owner, member, tenant } = rlsTest.getContext();

        // Create complete setup
        const service = await createTestService(tenant.id);
        const role = await createTestServiceRole(tenant.id, service.id);
        const event = await createTestServiceEvent(tenant.id, service.id);

        const { data: eventOwner } = await owner.client
          .from("service_event_owners")
          .insert({
            tenant_id: tenant.id,
            service_event_id: event.id,
            user_id: member.id,
            service_role_id: role.id,
          })
          .select()
          .single();

        // Member should be able to view
        const { data: memberView, error: memberError } = await member.client
          .from("service_event_owners")
          .select("*")
          .eq("id", eventOwner.id)
          .single();

        expect(memberError).toBeNull();
        expect(memberView).toBeDefined();
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });

  describe("Cross-table Access Control", () => {
    it("should prevent access to services from different tenants", async () => {
      await rlsTest.setupTestContext();
      try {
        const { member } = rlsTest.getContext();

        // Create another tenant and user
        const otherOwner = await createTestUser();
        const otherTenant = await createTestTenant(otherOwner.id);

        // Create service in other tenant
        const otherService = await createTestService(otherTenant.id);

        // Member from first tenant should not see service from other tenant
        const { data } = await member.client.from("services").select("*").eq("id", otherService.id);

        expect(data).toEqual([]);

        // Cleanup other tenant
        await cleanupTestTenant(otherTenant.id);
        await cleanupTestUser(otherOwner.id);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });

    it("should prevent anonymous users from accessing any services data", async () => {
      await rlsTest.setupTestContext();
      try {
        const { tenant } = rlsTest.getContext();

        // Create service
        const service = await createTestService(tenant.id);

        // Anonymous client should not be able to access services
        const { data } = await anonClient.from("services").select("*").eq("id", service.id);

        expect(data).toEqual([]);
      } finally {
        await rlsTest.cleanupTestContext();
      }
    });
  });
});
