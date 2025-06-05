/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

// Mock data factories
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
  price_tier: {
    name: "Basic",
    price_monthly: 29,
    user_limit: 50,
    group_limit: 10,
    event_limit: 20,
  },
};

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  fullName: "Test User",
};

// Mock service functions
export const mockTenantService = {
  getTenants: jest.fn(),
  createTenant: jest.fn(),
  updateTenant: jest.fn(),
  deleteTenant: jest.fn(),
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
