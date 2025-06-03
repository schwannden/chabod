import { checkTestEnvironment, serviceRoleClient, anonClient } from "../setup";
import {
  createTestUser,
  createTestTenant,
  addUserToTenant,
  cleanupTestUser,
  cleanupTestTenant,
  createTestEvent,
} from "../helpers/test-data-factory";

describe("Events RLS Policies", () => {
  beforeEach(() => {
    checkTestEnvironment();
  });

  describe('Public Event Visibility Policy: "Anyone can view public events"', () => {
    it("should allow anonymous users to view public events", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Create a public event
        const event = await createTestEvent(tenant.id, owner.id, {
          visibility: "public",
          title: "Public Test Event",
        });

        // Anonymous user should be able to view public events
        const { data, error } = await anonClient
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Public Test Event");
        expect(data.visibility).toBe("public");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should prevent anonymous users from viewing private events", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Create a private event
        const event = await createTestEvent(tenant.id, owner.id, {
          visibility: "private",
          title: "Private Test Event",
        });

        // Anonymous user should NOT be able to view private events
        const { data, error } = await anonClient
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });

    it("should allow authenticated outsiders to view public events", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Create a public event
        const event = await createTestEvent(tenant.id, owner.id, {
          visibility: "public",
          title: "Public Event for Outsiders",
        });

        // Outsider should be able to view public events
        const { data, error } = await outsider.client
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Public Event for Outsiders");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Tenant Member Access Policy: "Tenant members can view all events"', () => {
    it("should allow tenant members to view private events in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Create a private event
        const event = await createTestEvent(tenant.id, owner.id, {
          visibility: "private",
          title: "Private Event for Members",
        });

        // Member should be able to view private events in their tenant
        const { data, error } = await member.client
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Private Event for Members");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent non-members from viewing private events", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Create a private event
        const event = await createTestEvent(tenant.id, owner.id, {
          visibility: "private",
          title: "Private Event No Access",
        });

        // Outsider should NOT be able to view private events
        const { data, error } = await outsider.client
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(error?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Event Creator Management Policy: "Event creator can manage their own events"', () => {
    it("should allow event creators to update their own events", async () => {
      const creator = await createTestUser();
      const tenant = await createTestTenant(creator.id);

      try {
        const event = await createTestEvent(tenant.id, creator.id, {
          title: "Original Title",
        });

        // Creator should be able to update their own event
        const { data, error } = await creator.client
          .from("events")
          .update({ name: "Updated Title" })
          .eq("id", event.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Updated Title");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(creator.id);
      }
    });

    it("should allow event creators to delete their own events", async () => {
      const creator = await createTestUser();
      const tenant = await createTestTenant(creator.id);

      try {
        const event = await createTestEvent(tenant.id, creator.id, {
          title: "Event to Delete",
        });

        // Creator should be able to delete their own event
        const { error } = await creator.client.from("events").delete().eq("id", event.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(creator.id);
      }
    });

    it("should prevent non-creators from updating events they did not create", async () => {
      const creator = await createTestUser();
      const otherMember = await createTestUser();
      const tenant = await createTestTenant(creator.id);

      try {
        await addUserToTenant(otherMember.id, tenant.id, "member");

        const event = await createTestEvent(tenant.id, creator.id, {
          title: "Protected Event",
        });

        // Other member should NOT be able to update event they didn't create
        const { data, error } = await otherMember.client
          .from("events")
          .update({ name: "Unauthorized Update" })
          .eq("id", event.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
        // Error may be null but operation should not succeed

        // Verify the event was not actually updated
        const { data: unchangedEvent } = await serviceRoleClient
          .from("events")
          .select("name")
          .eq("id", event.id)
          .single();

        expect(unchangedEvent?.name).toBe("Protected Event"); // Should remain unchanged
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(creator.id);
        await cleanupTestUser(otherMember.id);
      }
    });
  });

  describe('Tenant Owner Management Policy: "Tenant owners can manage events within the tenant"', () => {
    it("should allow tenant owners to update any event in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Member creates an event
        const event = await createTestEvent(tenant.id, member.id, {
          title: "Member Created Event",
        });

        // Owner should be able to update any event in their tenant
        const { data, error } = await owner.client
          .from("events")
          .update({ name: "Owner Updated Event" })
          .eq("id", event.id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Owner Updated Event");
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should allow tenant owners to delete any event in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Member creates an event
        const event = await createTestEvent(tenant.id, member.id, {
          title: "Event to be Deleted by Owner",
        });

        // Owner should be able to delete any event in their tenant
        const { error } = await owner.client.from("events").delete().eq("id", event.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data, error: selectError } = await serviceRoleClient
          .from("events")
          .select("*")
          .eq("id", event.id)
          .single();

        expect(selectError?.code).toBe("PGRST116"); // Not found
        expect(data).toBeNull();
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent owners of other tenants from managing events", async () => {
      const owner1 = await createTestUser();
      const owner2 = await createTestUser();
      const tenant1 = await createTestTenant(owner1.id);
      const tenant2 = await createTestTenant(owner2.id);

      try {
        // Owner1 creates an event in tenant1
        const event = await createTestEvent(tenant1.id, owner1.id, {
          title: "Tenant1 Event",
        });

        // Owner2 should NOT be able to update events in tenant1
        const { data, error } = await owner2.client
          .from("events")
          .update({ name: "Cross-tenant Attack" })
          .eq("id", event.id)
          .select();

        // Should return empty array (no rows updated) due to RLS policy
        expect(data).toEqual([]);
        // Error may be null but operation should not succeed

        // Verify the event was not actually updated
        const { data: unchangedEvent } = await serviceRoleClient
          .from("events")
          .select("name")
          .eq("id", event.id)
          .single();

        expect(unchangedEvent?.name).toBe("Tenant1 Event"); // Should remain unchanged
      } finally {
        await cleanupTestTenant(tenant1.id);
        await cleanupTestTenant(tenant2.id);
        await cleanupTestUser(owner1.id);
        await cleanupTestUser(owner2.id);
      }
    });
  });

  describe('Event Creation Policy: "Users can create events within their tenants"', () => {
    it("should allow tenant members to create events in their tenant", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        await addUserToTenant(member.id, tenant.id, "member");

        // Member should be able to create events in their tenant
        const { data, error } = await member.client
          .from("events")
          .insert({
            name: "Member Created Event",
            description: "Event created by tenant member",
            date: new Date().toISOString().split("T")[0],
            start_time: "09:00:00",
            end_time: "10:00:00",
            visibility: "private",
            tenant_id: tenant.id,
            created_by: member.id,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe("Member Created Event");
        expect(data.created_by).toBe(member.id);
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(member.id);
      }
    });

    it("should prevent non-members from creating events in a tenant", async () => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // First, verify that the outsider is indeed not a member using our validation function
        const { data: validationData } = await serviceRoleClient.rpc("validate_event_creation", {
          tenant_uuid: tenant.id,
          user_uuid: outsider.id,
        });

        // The validation should show the user is not a member
        expect(validationData?.[0]?.is_member).toBe(false);
        expect(validationData?.[0]?.can_create).toBe(false);

        // Outsider should NOT be able to create events in tenant
        const { data, error } = await outsider.client
          .from("events")
          .insert({
            name: "Unauthorized Event",
            description: "Event by non-member",
            date: new Date().toISOString().split("T")[0],
            start_time: "09:00:00",
            end_time: "10:00:00",
            visibility: "private",
            tenant_id: tenant.id,
            created_by: outsider.id,
          })
          .select();

        // Should fail due to RLS policy
        expect(error).toBeTruthy();
        expect(data).toBeNull();

        // Check common RLS error patterns
        if (error) {
          const errorMsg = error.message || error.code || "Unknown error";
          expect(errorMsg).toMatch(
            /new row violates row-level security policy|permission denied|access denied|insufficient_privilege/i,
          );
        }
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
        await cleanupTestUser(outsider.id);
      }
    });
  });

  describe('Event Limit Enforcement Policy: "enforce_tenant_event_limit"', () => {
    it("should enforce tenant event limits based on price tier", async () => {
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);

      try {
        // Get the price tier limit
        const { data: tierData } = await serviceRoleClient
          .from("price_tiers")
          .select("event_limit")
          .eq("id", tenant.priceTierId)
          .single();

        const eventLimit = tierData?.event_limit || 20;

        // Create events up to the limit sequentially
        const createdEventIds: string[] = [];
        for (let i = 0; i < eventLimit; i++) {
          const { data, error } = await owner.client
            .from("events")
            .insert({
              name: `Event ${i + 1}`,
              description: `Test event ${i + 1}`,
              date: new Date().toISOString().split("T")[0],
              start_time: "09:00:00",
              end_time: "10:00:00",
              visibility: "private",
              tenant_id: tenant.id,
              created_by: owner.id,
            })
            .select("id")
            .single();

          // Each event up to the limit should succeed
          expect(error).toBeNull();
          expect(data?.id).toBeDefined();
          if (data?.id) createdEventIds.push(data.id);
        }

        // Verify we've hit the limit using our validation function
        const { data: validationData } = await serviceRoleClient.rpc("validate_event_creation", {
          tenant_uuid: tenant.id,
          user_uuid: owner.id,
        });

        expect(validationData?.[0]?.is_member).toBe(true);
        expect(validationData?.[0]?.under_limit).toBe(false); // Should be at limit
        expect(validationData?.[0]?.can_create).toBe(false);

        // Trying to create one more should fail due to limit
        const { data, error: limitError } = await owner.client
          .from("events")
          .insert({
            name: "Over Limit Event",
            description: "This should fail",
            date: new Date().toISOString().split("T")[0],
            start_time: "09:00:00",
            end_time: "10:00:00",
            visibility: "private",
            tenant_id: tenant.id,
            created_by: owner.id,
          })
          .select();

        // Should fail due to event limit policy
        expect(limitError).toBeTruthy();
        expect(data).toBeNull();

        if (limitError) {
          const errorMsg = limitError.message || limitError.code || "Unknown error";
          expect(errorMsg).toMatch(
            /new row violates row-level security policy|permission denied|access denied|insufficient_privilege/i,
          );
        }

        // Clean up created events
        if (createdEventIds.length > 0) {
          await serviceRoleClient.from("events").delete().in("id", createdEventIds);
        }
      } finally {
        await cleanupTestTenant(tenant.id);
        await cleanupTestUser(owner.id);
      }
    });
  });
});
