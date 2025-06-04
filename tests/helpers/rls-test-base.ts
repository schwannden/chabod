import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  checkTestEnvironment,
  serviceRoleClient,
  anonClient,
  TestUser,
  TestTenant,
} from "../setup";
import {
  createTestUser,
  createTestTenant,
  addUserToTenant,
  cleanupTestUser,
  cleanupTestTenant,
} from "./test-data-factory";

export interface TestContext {
  owner: TestUser;
  member: TestUser;
  outsider: TestUser;
  tenant: TestTenant;
}

export interface RLSTestOptions {
  entityName: string;
  tableName: string;
  createEntityFn?: (
    tenantId: string,
    overrides?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  additionalEntityData?: Record<string, unknown>;
  skipOwnerTests?: boolean;
  skipMemberTests?: boolean;
  skipAnonymousTests?: boolean;
  skipOutsiderTests?: boolean;
}

/**
 * Base class for RLS (Row Level Security) testing.
 * Provides common patterns and utilities for testing RLS policies across different entities.
 */
export class RLSTestBase {
  private context: TestContext | null = null;

  /**
   * Sets up a standard test context with owner, member, outsider, and tenant.
   * Should be called in beforeEach or at the start of individual tests.
   */
  async setupTestContext(): Promise<TestContext> {
    const owner = await createTestUser();
    const member = await createTestUser();
    const outsider = await createTestUser();
    const tenant = await createTestTenant(owner.id);

    await addUserToTenant(member.id, tenant.id, "member");

    this.context = { owner, member, outsider, tenant };
    return this.context;
  }

  /**
   * Cleans up the test context.
   * Should be called in afterEach or in finally blocks.
   */
  async cleanupTestContext(): Promise<void> {
    if (!this.context) return;

    const { owner, member, outsider, tenant } = this.context;

    try {
      await cleanupTestTenant(tenant.id);
      await Promise.all([
        cleanupTestUser(owner.id),
        cleanupTestUser(member.id),
        cleanupTestUser(outsider.id),
      ]);
    } catch (error) {
      console.warn("Cleanup error:", error);
    }

    this.context = null;
  }

  /**
   * Gets the current test context. Throws if context is not set up.
   */
  getContext(): TestContext {
    if (!this.context) {
      throw new Error("Test context not set up. Call setupTestContext() first.");
    }
    return this.context;
  }

  /**
   * Standard test for entity creation by owners
   */
  async testOwnerCanCreate(
    tableName: string,
    entityData: Record<string, unknown>,
    expectedFields?: Record<string, unknown>,
  ): Promise<void> {
    const { owner } = this.getContext();

    const { data, error } = await owner.client.from(tableName).insert(entityData).select().single();

    expect(error).toBeNull();
    expect(data).toBeDefined();

    if (expectedFields) {
      Object.entries(expectedFields).forEach(([key, value]) => {
        expect(data[key]).toBe(value);
      });
    }
  }

  /**
   * Standard test for entity creation prevention for non-owners
   */
  async testNonOwnerCannotCreate(
    tableName: string,
    entityData: Record<string, unknown>,
    userType: "member" | "outsider" | "anonymous",
  ): Promise<void> {
    const context = this.getContext();
    let client;

    switch (userType) {
      case "member":
        client = context.member.client;
        break;
      case "outsider":
        client = context.outsider.client;
        break;
      case "anonymous":
        client = anonClient;
        break;
    }

    const { data, error } = await client.from(tableName).insert(entityData).select();

    expect(error).toBeDefined();
    expect(data).toBeNull();
    expect(error?.message).toContain("new row violates row-level security policy");
  }

  /**
   * Standard test for entity updates by owners
   */
  async testOwnerCanUpdate(
    tableName: string,
    entityId: string,
    updateData: Record<string, unknown>,
    expectedFields?: Record<string, unknown>,
  ): Promise<void> {
    const { owner } = this.getContext();

    const { data, error } = await owner.client
      .from(tableName)
      .update(updateData)
      .eq("id", entityId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();

    if (expectedFields) {
      Object.entries(expectedFields).forEach(([key, value]) => {
        expect(data[key]).toBe(value);
      });
    }
  }

  /**
   * Standard test for entity update prevention for non-owners
   */
  async testNonOwnerCannotUpdate(
    tableName: string,
    entityId: string,
    updateData: Record<string, unknown>,
    userType: "member" | "outsider" | "anonymous",
  ): Promise<void> {
    const context = this.getContext();
    let client;

    switch (userType) {
      case "member":
        client = context.member.client;
        break;
      case "outsider":
        client = context.outsider.client;
        break;
      case "anonymous":
        client = anonClient;
        break;
    }

    const { data, error: _error } = await client
      .from(tableName)
      .update(updateData)
      .eq("id", entityId)
      .select();

    // Should return empty array (no rows updated) due to RLS policy
    expect(data).toEqual([]);
  }

  /**
   * Standard test for entity deletion by owners
   */
  async testOwnerCanDelete(tableName: string, entityId: string): Promise<void> {
    const { owner } = this.getContext();

    const { error } = await owner.client.from(tableName).delete().eq("id", entityId);

    expect(error).toBeNull();

    // Verify deletion
    const { data, error: selectError } = await serviceRoleClient
      .from(tableName)
      .select("*")
      .eq("id", entityId)
      .single();

    expect(selectError?.code).toBe("PGRST116"); // Not found
    expect(data).toBeNull();
  }

  /**
   * Standard test for entity deletion prevention for non-owners
   */
  async testNonOwnerCannotDelete(
    tableName: string,
    entityId: string,
    userType: "member" | "outsider" | "anonymous",
  ): Promise<void> {
    const context = this.getContext();
    let client;

    switch (userType) {
      case "member":
        client = context.member.client;
        break;
      case "outsider":
        client = context.outsider.client;
        break;
      case "anonymous":
        client = anonClient;
        break;
    }

    const { data, error: _error } = await client
      .from(tableName)
      .delete()
      .eq("id", entityId)
      .select();

    // Should return empty array (no rows deleted) due to RLS policy
    expect(data).toEqual([]);

    // Verify entity still exists
    const { data: stillExists } = await serviceRoleClient
      .from(tableName)
      .select("*")
      .eq("id", entityId)
      .single();

    expect(stillExists).toBeDefined();
  }

  /**
   * Standard test for entity viewing by tenant members
   */
  async testTenantMemberCanView(
    tableName: string,
    entityId: string,
    userType: "owner" | "member",
  ): Promise<void> {
    const context = this.getContext();
    const client = userType === "owner" ? context.owner.client : context.member.client;

    const { data, error } = await client.from(tableName).select("*").eq("id", entityId).single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(entityId);
  }

  /**
   * Standard test for entity viewing prevention for outsiders
   */
  async testOutsiderCannotView(tableName: string, entityId: string): Promise<void> {
    const { outsider } = this.getContext();

    const { data, error } = await outsider.client
      .from(tableName)
      .select("*")
      .eq("id", entityId)
      .single();

    expect(error?.code).toBe("PGRST116"); // Not found
    expect(data).toBeNull();
  }

  /**
   * Comprehensive CRUD test suite for standard RLS patterns
   */
  createStandardRLSTestSuite(options: RLSTestOptions): void {
    const {
      entityName,
      tableName,
      createEntityFn,
      additionalEntityData = {},
      skipOwnerTests = false,
      skipMemberTests = false,
      skipAnonymousTests = false,
      skipOutsiderTests = false,
    } = options;

    describe(`${entityName} RLS Policies`, () => {
      beforeEach(() => {
        checkTestEnvironment();
      });

      if (!skipOwnerTests) {
        describe(`${entityName} Creation Policy`, () => {
          it(`should allow tenant owners to create ${entityName.toLowerCase()}s`, async () => {
            await this.setupTestContext();
            try {
              const { tenant } = this.getContext();
              const entityData = {
                tenant_id: tenant.id,
                name: `Test ${entityName}`,
                ...additionalEntityData,
              };

              await this.testOwnerCanCreate(tableName, entityData, { name: `Test ${entityName}` });
            } finally {
              await this.cleanupTestContext();
            }
          });

          if (!skipMemberTests) {
            it(`should prevent members from creating ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                const entityData = {
                  tenant_id: tenant.id,
                  name: `Unauthorized ${entityName}`,
                  ...additionalEntityData,
                };

                await this.testNonOwnerCannotCreate(tableName, entityData, "member");
              } finally {
                await this.cleanupTestContext();
              }
            });
          }

          if (!skipOutsiderTests) {
            it(`should prevent outsiders from creating ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                const entityData = {
                  tenant_id: tenant.id,
                  name: `Outsider ${entityName}`,
                  ...additionalEntityData,
                };

                await this.testNonOwnerCannotCreate(tableName, entityData, "outsider");
              } finally {
                await this.cleanupTestContext();
              }
            });
          }

          if (!skipAnonymousTests) {
            it(`should prevent anonymous users from creating ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                const entityData = {
                  tenant_id: tenant.id,
                  name: `Anonymous ${entityName}`,
                  ...additionalEntityData,
                };

                await this.testNonOwnerCannotCreate(tableName, entityData, "anonymous");
              } finally {
                await this.cleanupTestContext();
              }
            });
          }
        });

        describe(`${entityName} Update Policy`, () => {
          it(`should allow tenant owners to update ${entityName.toLowerCase()}s`, async () => {
            await this.setupTestContext();
            try {
              const { tenant } = this.getContext();
              let entity;

              if (createEntityFn) {
                entity = await createEntityFn(tenant.id);
              } else {
                throw new Error("createEntityFn is required for update tests");
              }

              await this.testOwnerCanUpdate(
                tableName,
                entity.id,
                { name: `Updated ${entityName}` },
                { name: `Updated ${entityName}` },
              );
            } finally {
              await this.cleanupTestContext();
            }
          });

          if (!skipMemberTests) {
            it(`should prevent members from updating ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                let entity;

                if (createEntityFn) {
                  entity = await createEntityFn(tenant.id);
                } else {
                  throw new Error("createEntityFn is required for update tests");
                }

                await this.testNonOwnerCannotUpdate(
                  tableName,
                  entity.id,
                  { name: "Unauthorized Update" },
                  "member",
                );
              } finally {
                await this.cleanupTestContext();
              }
            });
          }

          if (!skipOutsiderTests) {
            it(`should prevent outsiders from updating ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                let entity;

                if (createEntityFn) {
                  entity = await createEntityFn(tenant.id);
                } else {
                  throw new Error("createEntityFn is required for update tests");
                }

                await this.testNonOwnerCannotUpdate(
                  tableName,
                  entity.id,
                  { name: "Outsider Update" },
                  "outsider",
                );
              } finally {
                await this.cleanupTestContext();
              }
            });
          }
        });

        describe(`${entityName} Delete Policy`, () => {
          it(`should allow tenant owners to delete ${entityName.toLowerCase()}s`, async () => {
            await this.setupTestContext();
            try {
              const { tenant } = this.getContext();
              let entity;

              if (createEntityFn) {
                entity = await createEntityFn(tenant.id);
              } else {
                throw new Error("createEntityFn is required for delete tests");
              }

              await this.testOwnerCanDelete(tableName, entity.id);
            } finally {
              await this.cleanupTestContext();
            }
          });

          if (!skipMemberTests) {
            it(`should prevent members from deleting ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                let entity;

                if (createEntityFn) {
                  entity = await createEntityFn(tenant.id);
                } else {
                  throw new Error("createEntityFn is required for delete tests");
                }

                await this.testNonOwnerCannotDelete(tableName, entity.id, "member");
              } finally {
                await this.cleanupTestContext();
              }
            });
          }

          if (!skipOutsiderTests) {
            it(`should prevent outsiders from deleting ${entityName.toLowerCase()}s`, async () => {
              await this.setupTestContext();
              try {
                const { tenant } = this.getContext();
                let entity;

                if (createEntityFn) {
                  entity = await createEntityFn(tenant.id);
                } else {
                  throw new Error("createEntityFn is required for delete tests");
                }

                await this.testNonOwnerCannotDelete(tableName, entity.id, "outsider");
              } finally {
                await this.cleanupTestContext();
              }
            });
          }
        });
      }
    });
  }
}

/**
 * Utility function to create a new RLS test instance
 */
export const createRLSTest = () => new RLSTestBase();
