import { config } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, afterEach, afterAll } from "@jest/globals";

// Load environment variables
config({ path: ".env.test" });

// Test configuration
export const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || "http://localhost:54321",
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  testDbUrl:
    process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres",
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

export const cleanupTestData = async () => {
  try {
    // Delete test tenants and related data (cascades should handle relations)
    await serviceRoleClient.from("tenants").delete().like("slug", "test-%");

    // Delete test users from profiles
    await serviceRoleClient.from("profiles").delete().like("email", "%@test.example.com");
  } catch (error) {
    console.warn("Cleanup data error:", error);
  }
};

// Global setup that runs before each test
beforeEach(() => {
  checkTestEnvironment();
});

// Clean up test data after each test suite
afterEach(async () => {
  // This will be implemented in individual test files as needed
});

// Global cleanup
afterAll(async () => {
  // Clean up any remaining test data
  try {
    await cleanupTestData();
  } catch (error) {
    console.warn("Cleanup warning:", error);
  }
});
