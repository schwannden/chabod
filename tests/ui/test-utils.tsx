/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { render, RenderOptions, configure } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { SessionContextType } from "@/lib/types";
import { User, Session } from "@supabase/supabase-js";

// Configure React Testing Library for React 18
configure({
  reactStrictMode: true,
  asyncUtilTimeout: 10000,
});

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Default mock data factories
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {},
  role: "authenticated",
  updated_at: "2024-01-01T00:00:00Z",
} as User;

export const mockProfile = {
  id: "profile-id-456",
  full_name: "Test User",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  avatar_url: "",
  updated_at: new Date().toISOString(),
};

export const mockSession = {
  access_token: "mock_access_token",
  refresh_token: "mock_refresh_token",
  user: mockUser,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
} as Session;

// Base session context with sensible defaults
const createBaseSessionContext = (): SessionContextType => ({
  session: mockSession,
  user: mockUser,
  profile: mockProfile,
  isLoading: false,
  signOut: jest.fn().mockResolvedValue(undefined),
  refetchProfile: jest.fn().mockResolvedValue(undefined),
});

// Main mockUseSession function with improved defaults
export const mockUseSession = (overrides: Partial<SessionContextType> = {}) => {
  const baseContext = createBaseSessionContext();
  const finalContext = { ...baseContext, ...overrides };

  (useSession as jest.Mock).mockReturnValue(finalContext);
  return finalContext;
};

// Helper functions for common test scenarios
export const mockUseSessionHelpers = {
  // User is loading (common initial state)
  loading: () =>
    mockUseSession({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
    }),

  // User is not authenticated
  unauthenticated: () =>
    mockUseSession({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
    }),

  // User is authenticated with default user and profile
  authenticated: (
    userOverrides: Partial<User> = {},
    profileOverrides: Partial<typeof mockProfile> = {},
  ) =>
    mockUseSession({
      session: mockSession,
      user: { ...mockUser, ...userOverrides },
      profile: { ...mockProfile, ...profileOverrides },
      isLoading: false,
    }),

  // User is authenticated but no profile loaded
  authenticatedNoProfile: (userOverrides: Partial<User> = {}) =>
    mockUseSession({
      session: mockSession,
      user: { ...mockUser, ...userOverrides },
      profile: null,
      isLoading: false,
    }),

  // User is authenticated with custom user data
  withUser: (user: Partial<User>) =>
    mockUseSession({
      session: mockSession,
      user: { ...mockUser, ...user },
      profile: mockProfile,
      isLoading: false,
    }),

  // User is authenticated with custom profile data
  withProfile: (profile: Partial<typeof mockProfile>) =>
    mockUseSession({
      session: mockSession,
      user: mockUser,
      profile: { ...mockProfile, ...profile },
      isLoading: false,
    }),
};

export const mockTenant = {
  id: "test-tenant-id",
  name: "Test Church",
  slug: "test-church",
  price_tier_id: "basic-tier-id",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  memberCount: 10,
  groupCount: 2,
  eventCount: 2,
  userRole: "owner", // Default to owner for most tests
  price_tier: {
    name: "Basic",
    price_monthly: 29,
    user_limit: 50,
    group_limit: 10,
    event_limit: 20,
  },
};

// Mock service functions
export const mockTenantService = {
  getTenants: jest.fn(),
  createTenant: jest.fn(),
  updateTenant: jest.fn(),
  deleteTenant: jest.fn(),
};

// Mock the entire useSession hook module
jest.mock("@/hooks/useSession", () => ({
  useSession: jest.fn(),
}));

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
