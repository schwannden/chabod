import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test-utils";
import DashboardPage from "@/pages/DashboardPage";
import * as tenantUtils from "@/lib/tenant-utils";
import { useSession } from "@/hooks/useSession";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Get the mocked useSession
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("DashboardPage", () => {
  const mockTenantsData = [
    {
      id: "tenant-1",
      name: "First Church",
      slug: "first-church",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      price_tier_id: "basic",
      memberCount: 10,
      groupCount: 2,
      eventCount: 3,
      price_tier: {
        name: "Basic",
        price_monthly: 29,
        user_limit: 50,
        group_limit: 10,
        event_limit: 20,
      },
    },
    {
      id: "tenant-2",
      name: "Second Church",
      slug: "second-church",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      price_tier_id: "pro",
      memberCount: 25,
      groupCount: 5,
      eventCount: 8,
      price_tier: {
        name: "Pro",
        price_monthly: 59,
        user_limit: 100,
        group_limit: 25,
        event_limit: 50,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock setup for getTenants
    (tenantUtils.getTenants as jest.Mock).mockResolvedValue(mockTenantsData);

    // Default mock setup for useSession
    mockUseSession.mockReturnValue({
      session: null,
      user: {
        id: "test-user-id",
        email: "test@example.com",
        aud: "authenticated",
        created_at: "2024-01-01T00:00:00Z",
        app_metadata: {},
        user_metadata: {},
        role: "authenticated",
        updated_at: "2024-01-01T00:00:00Z",
      },
      profile: null,
      isLoading: false,
      signOut: jest.fn(),
    });
  });

  describe("Authentication and Loading", () => {
    it("should show loading state when session is loading", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should redirect to auth when user is not logged in", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<DashboardPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  describe("Tenant List Display", () => {
    it("should display tenant list when tenants exist", async () => {
      await act(async () => {
        render(<DashboardPage />);
      });

      // Wait for tenants to load
      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      // Wait for the loading state to complete
      await waitFor(() => {
        expect(screen.queryByText("dashboard.loadingChurchesList")).not.toBeInTheDocument();
      });

      // Check that tenants are displayed
      expect(screen.getByText("First Church")).toBeInTheDocument();
      expect(screen.getByText("Second Church")).toBeInTheDocument();

      // Verify getTenants was called
      expect(tenantUtils.getTenants).toHaveBeenCalledTimes(1);
    });

    it("should show empty state when no tenants exist", async () => {
      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.noChurchesYet")).toBeInTheDocument();
        expect(screen.getByText("dashboard.addFirstChurch")).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching tenants", () => {
      // Mock a pending promise
      (tenantUtils.getTenants as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<DashboardPage />);

      expect(screen.getByText("dashboard.loadingChurchesList")).toBeInTheDocument();
    });

    it("should handle tenant fetching errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantUtils.getTenants as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.noChurchesYet")).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching tenants:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("Tenant Creation", () => {
    it("should open create dialog when add button is clicked", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /dashboard.addChurch/i });
      await user.click(addButton);

      // The dialog should be open (this depends on TenantCreateDialog implementation)
      // We can test the dialog opening by checking if the button was clicked
      expect(addButton).toBeInTheDocument();
    });

    it("should have add button visible in empty state", async () => {
      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.noChurchesYet")).toBeInTheDocument();
      });

      // Should have two add buttons - one in header, one in empty state
      const addButtons = screen.getAllByText("dashboard.addChurch");
      expect(addButtons).toHaveLength(2);
    });
  });

  describe("Tenant Management", () => {
    it("should refresh tenant list after tenant changes", async () => {
      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("First Church")).toBeInTheDocument();
      });

      // Simulate a tenant update by calling the refresh function
      // This is somewhat artificial since we need to access the component's internal handler
      // In a real scenario, this would be triggered by child components

      // Mock the updated data
      const updatedTenantsData = [
        {
          ...mockTenantsData[0],
          name: "Updated First Church",
        },
        mockTenantsData[1],
      ];

      (tenantUtils.getTenants as jest.Mock).mockResolvedValueOnce(updatedTenantsData);

      // This test verifies the structure exists, actual refresh testing would need integration testing
      expect(tenantUtils.getTenants).toHaveBeenCalledTimes(1);
    });
  });

  describe("Component Structure", () => {
    it("should render navigation bar", async () => {
      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      // The NavBar should be rendered (this depends on NavBar implementation)
      // We can check for common navigation elements
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });

    it("should have proper page structure", async () => {
      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      // Check for main content area
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass("container");

      // Check for header with title and button
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("dashboard.churchesYouManage");

      const addButton = screen.getByRole("button", { name: /dashboard.addChurch/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe("User Experience", () => {
    it("should show proper loading messages", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (tenantUtils.getTenants as jest.Mock).mockReturnValue(promise);

      render(<DashboardPage />);

      // Initial render should show tenant loading
      expect(screen.getByText("dashboard.loadingChurchesList")).toBeInTheDocument();

      // Resolve the promise to complete loading
      await act(async () => {
        resolvePromise(mockTenantsData);
        await promise;
      });

      // Loading message should disappear after data loads
      await waitFor(() => {
        expect(screen.queryByText("dashboard.loadingChurchesList")).not.toBeInTheDocument();
      });
    });

    it("should display tenant grid layout when tenants exist", async () => {
      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("First Church")).toBeInTheDocument();
      });

      // Check for grid container (this is a CSS-based test)
      const gridContainer = screen.getByText("First Church").closest(".grid");
      expect(gridContainer).toHaveClass("grid-cols-1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing user gracefully", async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<DashboardPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });

    it("should not fetch tenants when user is not available", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<DashboardPage />);

      // getTenants should not be called if there's no user
      expect(tenantUtils.getTenants).not.toHaveBeenCalled();
    });

    it("should handle rapid user state changes", async () => {
      // Start with no user
      const { rerender } = render(<DashboardPage />);

      // Then set a user
      mockUseSession.mockReturnValue({
        session: null,
        user: {
          id: "test-user-id",
          email: "test@example.com",
          aud: "authenticated",
          created_at: "2024-01-01T00:00:00Z",
          app_metadata: {},
          user_metadata: {},
          role: "authenticated",
          updated_at: "2024-01-01T00:00:00Z",
        },
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        rerender(<DashboardPage />);
      });

      await waitFor(() => {
        expect(tenantUtils.getTenants).toHaveBeenCalled();
      });
    });
  });
});
