import { config } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, afterEach, afterAll } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
config({ path: ".env.test" });

// Generate unique test session ID for this worker/process
export const TEST_SESSION_ID = `test-${Date.now()}-${process.pid}-${uuidv4().slice(0, 8)}`;

// Test configuration
export const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || "http://localhost:54321",
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  testDbUrl:
    process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres",
  // Add session prefix for test isolation
  testSessionId: TEST_SESSION_ID,
};

// Global test utilities
export interface TestUser {
  id: string;
  email: string;
  fullName: string;
  client: SupabaseClient;
}

export interface TestTenant {
  id: string;
  name: string;
  slug: string;
  priceTierId: string;
}

// Service role client for admin operations
export const serviceRoleClient = createClient(
  TEST_CONFIG.supabaseUrl,
  TEST_CONFIG.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Anonymous client
export const anonClient = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey);

// Helper to create authenticated client for a specific user ID
export const createUserClient = (userId: string): SupabaseClient => {
  return createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey, {
    global: {
      headers: {
        "X-User-Id": userId, // Custom header for test user context
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper to create authenticated client for a specific user
export const createAuthenticatedClient = (accessToken: string): SupabaseClient => {
  return createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Utility to check if test environment is properly configured
export const checkTestEnvironment = () => {
  if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseAnonKey) {
    throw new Error(
      "Test environment not properly configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
  }

  if (!TEST_CONFIG.supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for tests");
  }
};

// Enhanced cleanup that's aware of test session
export const cleanupTestData = async (sessionId?: string) => {
  try {
    const searchPattern = sessionId ? `${sessionId}-%` : `test-${TEST_SESSION_ID}-%`;

    // Delete test tenants and related data (cascades should handle relations)
    await serviceRoleClient.from("tenants").delete().like("slug", searchPattern);

    // Delete test users from profiles with session-specific emails
    const emailPattern = sessionId
      ? `%${sessionId}%@test.example.com`
      : `%${TEST_SESSION_ID}%@test.example.com`;
    await serviceRoleClient.from("profiles").delete().like("email", emailPattern);

    console.log(`Cleaned up test data for session: ${sessionId || TEST_SESSION_ID}`);
  } catch (error) {
    console.warn("Cleanup data error:", error);
  }
};

// Cleanup for this specific test session
export const cleanupCurrentTestSession = async () => {
  await cleanupTestData(TEST_SESSION_ID);
};

// Global setup that runs before each test
beforeEach(() => {
  checkTestEnvironment();
});

// Clean up test data after each test suite
afterEach(async () => {
  // Individual tests should handle their own cleanup
  // This is here as a safety net for any leftover data
});

// Global cleanup for this test session
afterAll(async () => {
  try {
    await cleanupCurrentTestSession();
  } catch (error) {
    console.warn("Session cleanup warning:", error);
  }
});
