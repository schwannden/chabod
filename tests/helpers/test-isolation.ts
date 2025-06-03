import { serviceRoleClient, TEST_SESSION_ID } from "../setup";
import { v4 as uuidv4 } from "uuid";

// Test context for managing test data lifecycle
export class TestIsolation {
  private testId: string;
  private createdUsers: Set<string> = new Set();
  private createdTenants: Set<string> = new Set();
  private createdEntities: Map<string, Set<string>> = new Map(); // table -> ids

  constructor(testName?: string) {
    const uniqueId = uuidv4().slice(0, 8);
    this.testId = `${TEST_SESSION_ID}-${testName || "test"}-${uniqueId}`;
  }

  getTestId(): string {
    return this.testId;
  }

  // Track created resources for cleanup
  trackUser(userId: string): void {
    this.createdUsers.add(userId);
  }

  trackTenant(tenantId: string): void {
    this.createdTenants.add(tenantId);
  }

  trackEntity(tableName: string, entityId: string): void {
    if (!this.createdEntities.has(tableName)) {
      this.createdEntities.set(tableName, new Set());
    }
    this.createdEntities.get(tableName)!.add(entityId);
  }

  // Generate unique identifier for this test context
  generateUniqueId(): string {
    const uniqueId = uuidv4().slice(0, 8);
    const timestamp = Date.now();
    return `${this.testId}-${uniqueId}-${timestamp}`;
  }

  // Comprehensive cleanup of all tracked resources
  async cleanup(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    try {
      // Clean up tracked entities (except users and tenants which have special handling)
      for (const [tableName, entityIds] of this.createdEntities.entries()) {
        if (tableName !== "users" && tableName !== "tenants" && entityIds.size > 0) {
          cleanupPromises.push(this.cleanupEntities(tableName, Array.from(entityIds)));
        }
      }

      // Clean up tenants (this will cascade to related data)
      if (this.createdTenants.size > 0) {
        cleanupPromises.push(this.cleanupTenants(Array.from(this.createdTenants)));
      }

      // Clean up users (profiles and auth)
      if (this.createdUsers.size > 0) {
        cleanupPromises.push(this.cleanupUsers(Array.from(this.createdUsers)));
      }

      // Wait for all cleanup operations
      await Promise.allSettled(cleanupPromises);

      console.log(`Test isolation cleanup completed for: ${this.testId}`);
    } catch (error) {
      console.warn(`Test isolation cleanup failed for ${this.testId}:`, error);
    }
  }

  private async cleanupEntities(tableName: string, entityIds: string[]): Promise<void> {
    try {
      const { error } = await serviceRoleClient.from(tableName).delete().in("id", entityIds);
      if (error) {
        console.warn(`Failed to cleanup ${tableName}:`, error.message);
      }
    } catch (error) {
      console.warn(`Error cleaning up ${tableName}:`, error);
    }
  }

  private async cleanupTenants(tenantIds: string[]): Promise<void> {
    try {
      // Tenant deletion cascades to related records
      const { error } = await serviceRoleClient.from("tenants").delete().in("id", tenantIds);
      if (error) {
        console.warn("Failed to cleanup tenants:", error.message);
      }
    } catch (error) {
      console.warn("Error cleaning up tenants:", error);
    }
  }

  private async cleanupUsers(userIds: string[]): Promise<void> {
    try {
      // Clean up profiles first
      const { error: profileError } = await serviceRoleClient
        .from("profiles")
        .delete()
        .in("id", userIds);

      if (profileError) {
        console.warn("Failed to cleanup profiles:", profileError.message);
      }

      // Clean up auth users
      for (const userId of userIds) {
        try {
          const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(userId);
          if (authError) {
            console.warn(`Failed to delete auth user ${userId}:`, authError.message);
          }
        } catch (error) {
          console.warn(`Error deleting auth user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.warn("Error cleaning up users:", error);
    }
  }

  // Utility to clean up test data by pattern (fallback method)
  static async cleanupByPattern(sessionId: string = TEST_SESSION_ID): Promise<void> {
    try {
      // Clean up tenants by slug pattern
      await serviceRoleClient.from("tenants").delete().like("slug", `${sessionId}-%`);

      // Clean up users by email pattern
      await serviceRoleClient
        .from("profiles")
        .delete()
        .like("email", `%${sessionId}%@test.example.com`);

      console.log(`Pattern-based cleanup completed for session: ${sessionId}`);
    } catch (error) {
      console.warn(`Pattern-based cleanup failed for ${sessionId}:`, error);
    }
  }
}

// Helper function to create isolated test context
export const createTestIsolation = (testName?: string): TestIsolation => {
  return new TestIsolation(testName);
};

// Helper to run a test with automatic cleanup
export const withTestIsolation = async <T>(
  testName: string,
  testFn: (isolation: TestIsolation) => Promise<T>,
): Promise<T> => {
  const isolation = createTestIsolation(testName);
  try {
    return await testFn(isolation);
  } finally {
    await isolation.cleanup();
  }
};
