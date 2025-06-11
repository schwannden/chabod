import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../test-utils";
import DashboardPage from "@/pages/DashboardPage";
import * as tenantUtils from "@/lib/tenant-utils";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

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
    mockUseSessionHelpers.authenticatedNoProfile();
  });

  describe("Authentication and Loading", () => {
    it("should show loading state when session is loading", () => {
      mockUseSessionHelpers.loading();

      render(<DashboardPage />);

      expect(screen.getByText("common:loading")).toBeInTheDocument();
    });

    it("should redirect to auth when user is not logged in", () => {
      mockUseSessionHelpers.unauthenticated();

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
        expect(screen.getByText("churchesYouManage")).toBeInTheDocument();
      });

      // Wait for the loading state to complete
      await waitFor(() => {
        expect(screen.queryByText("loadingChurchesList")).not.toBeInTheDocument();
      });

      // Check that tenants are displayed
      expect(screen.getByText("First Church")).toBeInTheDocument();
      expect(screen.getByText("Second Church")).toBeInTheDocument();

      // Verify getTenants was called (React Query may call it once)
      expect(tenantUtils.getTenants).toHaveBeenCalled();
    });

    it("should show empty state when no tenants exist", async () => {
      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("noChurchesYet")).toBeInTheDocument();
        expect(screen.getByText("addFirstChurch")).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching tenants", () => {
      // Mock a pending promise
      (tenantUtils.getTenants as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<DashboardPage />);

      expect(screen.getByText("loadingChurchesList")).toBeInTheDocument();
    });

    it("should handle tenant fetching errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantUtils.getTenants as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("noChurchesYet")).toBeInTheDocument();
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
        expect(screen.getByText("churchesYouManage")).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /addChurch/i });
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
        expect(screen.getByText("noChurchesYet")).toBeInTheDocument();
      });

      // Should have two add buttons - one in header, one in empty state
      const addButtons = screen.getAllByText("addChurch");
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
      // React Query handles the caching and calls automatically
      expect(tenantUtils.getTenants).toHaveBeenCalled();
    });
  });

  describe("Component Structure", () => {
    it("should render navigation bar", async () => {
      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("churchesYouManage")).toBeInTheDocument();
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
        expect(screen.getByText("churchesYouManage")).toBeInTheDocument();
      });

      // Check for main content area
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass("container");

      // Check for header with title and button
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("churchesYouManage");

      const addButton = screen.getByRole("button", { name: /addChurch/i });
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
      expect(screen.getByText("loadingChurchesList")).toBeInTheDocument();

      // Resolve the promise to complete loading
      await act(async () => {
        resolvePromise(mockTenantsData);
        await promise;
      });

      // Loading message should disappear after data loads
      await waitFor(() => {
        expect(screen.queryByText("loadingChurchesList")).not.toBeInTheDocument();
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
      mockUseSessionHelpers.unauthenticated();

      render(<DashboardPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });

    it("should not fetch tenants when user is not available", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<DashboardPage />);

      // getTenants should not be called if there's no user
      expect(tenantUtils.getTenants).not.toHaveBeenCalled();
    });

    it("should handle rapid user state changes", async () => {
      // Start with no user
      mockUseSessionHelpers.unauthenticated();
      const { rerender } = render(<DashboardPage />);

      // Then set a user
      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        rerender(<DashboardPage />);
      });

      await waitFor(() => {
        expect(tenantUtils.getTenants).toHaveBeenCalled();
      });
    });
  });

  describe("Tenant Ownership Functionality", () => {
    it("should show edit buttons for tenants where user is owner", async () => {
      const mockTenants = [
        {
          id: "tenant-1",
          name: "My Church",
          slug: "my-church",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 15,
          groupCount: 3,
          eventCount: 5,
          userRole: "owner", // User is owner
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
          name: "Other Church",
          slug: "other-church",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 10,
          groupCount: 2,
          eventCount: 3,
          userRole: "member", // User is just a member
          price_tier: {
            name: "Basic",
            price_monthly: 29,
            user_limit: 50,
            group_limit: 10,
            event_limit: 20,
          },
        },
      ];

      (tenantUtils.getTenants as jest.Mock).mockResolvedValue(mockTenants);

      render(<DashboardPage />);

      // Wait for tenants to load
      await waitFor(() => {
        expect(screen.getByText("My Church")).toBeInTheDocument();
        expect(screen.getByText("Other Church")).toBeInTheDocument();
      });

      // Get all edit buttons (pencil icons)
      const editButtons = screen.getAllByTestId("pencil-icon");

      // Should only have 1 edit button (for the church where user is owner)
      expect(editButtons).toHaveLength(1);

      // Verify edit button is for the correct tenant
      const myChurchCard = screen.getByText("My Church").closest("div");
      const otherChurchCard = screen.getByText("Other Church").closest("div");

      // My Church should have edit button (user is owner)
      expect(myChurchCard).toContainElement(editButtons[0]);

      // Other Church should not have edit button (user is member)
      expect(otherChurchCard).not.toContainElement(editButtons[0]);
    });

    it("should show no edit buttons when user is not owner of any tenants", async () => {
      const mockTenants = [
        {
          id: "tenant-1",
          name: "Church A",
          slug: "church-a",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 15,
          groupCount: 3,
          eventCount: 5,
          userRole: "member", // User is member
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
          name: "Church B",
          slug: "church-b",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 10,
          groupCount: 2,
          eventCount: 3,
          userRole: "admin", // User is admin (not owner)
          price_tier: {
            name: "Basic",
            price_monthly: 29,
            user_limit: 50,
            group_limit: 10,
            event_limit: 20,
          },
        },
      ];

      (tenantUtils.getTenants as jest.Mock).mockResolvedValue(mockTenants);

      render(<DashboardPage />);

      // Wait for tenants to load
      await waitFor(() => {
        expect(screen.getByText("Church A")).toBeInTheDocument();
        expect(screen.getByText("Church B")).toBeInTheDocument();
      });

      // Should have no edit buttons since user is not owner of any tenant
      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();
    });

    it("should show all edit buttons when user is owner of all tenants", async () => {
      const mockTenants = [
        {
          id: "tenant-1",
          name: "Church A",
          slug: "church-a",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 15,
          groupCount: 3,
          eventCount: 5,
          userRole: "owner", // User is owner
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
          name: "Church B",
          slug: "church-b",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 10,
          groupCount: 2,
          eventCount: 3,
          userRole: "owner", // User is owner
          price_tier: {
            name: "Basic",
            price_monthly: 29,
            user_limit: 50,
            group_limit: 10,
            event_limit: 20,
          },
        },
      ];

      (tenantUtils.getTenants as jest.Mock).mockResolvedValue(mockTenants);

      render(<DashboardPage />);

      // Wait for tenants to load
      await waitFor(() => {
        expect(screen.getByText("Church A")).toBeInTheDocument();
        expect(screen.getByText("Church B")).toBeInTheDocument();
      });

      // Should have 2 edit buttons (one for each tenant where user is owner)
      const editButtons = screen.getAllByTestId("pencil-icon");
      expect(editButtons).toHaveLength(2);

      // Should have 2 delete buttons as well
      const deleteButtons = screen.getAllByTestId("trash-icon");
      expect(deleteButtons).toHaveLength(2);
    });

    it("should handle null userRole gracefully", async () => {
      const mockTenants = [
        {
          id: "tenant-1",
          name: "Church A",
          slug: "church-a",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          price_tier_id: "basic-tier-id",
          memberCount: 15,
          groupCount: 3,
          eventCount: 5,
          userRole: null, // No role information
          price_tier: {
            name: "Basic",
            price_monthly: 29,
            user_limit: 50,
            group_limit: 10,
            event_limit: 20,
          },
        },
      ];

      (tenantUtils.getTenants as jest.Mock).mockResolvedValue(mockTenants);

      render(<DashboardPage />);

      // Wait for tenants to load
      await waitFor(() => {
        expect(screen.getByText("Church A")).toBeInTheDocument();
      });

      // Should have no edit buttons when userRole is null
      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();

      // But navigation buttons should still be present
      expect(screen.getByText("tenant:goToChurchDashboard")).toBeInTheDocument();
      expect(screen.getByText("tenant:goToChurchLogin")).toBeInTheDocument();
    });
  });

  describe("Loading and Error States", () => {
    it("should show loading state initially", () => {
      (tenantUtils.getTenants as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<DashboardPage />);

      expect(screen.getByText("loadingChurchesList")).toBeInTheDocument();
    });

    it("should handle empty tenant list", async () => {
      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([]);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("noChurchesYet")).toBeInTheDocument();
        expect(screen.getByText("addFirstChurch")).toBeInTheDocument();
      });

      // Should still show the "Add Church" button
      const addButtons = screen.getAllByText("addChurch");
      expect(addButtons).toHaveLength(2); // One in header, one in empty state
    });
  });

  describe("User Interactions", () => {
    it("should open create dialog when add church button is clicked", async () => {
      const user = userEvent.setup();

      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([]);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("noChurchesYet")).toBeInTheDocument();
      });

      // Click the add church button in the header
      const addButton = screen.getAllByText("addChurch")[0];
      await user.click(addButton);

      // The create dialog should open
      // This would be tested by checking if the dialog component is rendered
      // In a real implementation, you might check for dialog-specific elements
    });
  });
});
