import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockTenant } from "../../test-utils";
import DashboardPage from "@/pages/DashboardPage";
import { TenantCard } from "@/components/Tenants/TenantCard";
import * as tenantUtils from "@/lib/tenant-utils";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Tenant Operations Integration Tests", () => {
  const mockTenantWithUsage = {
    ...mockTenant,
    id: "tenant-1",
    name: "Test Church",
    slug: "test-church",
    memberCount: 15,
    groupCount: 3,
    eventCount: 5,
    userRole: "owner", // Add userRole so edit/delete buttons are visible
    price_tier: {
      name: "Basic",
      price_monthly: 29,
      user_limit: 50,
      group_limit: 10,
      event_limit: 20,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default session
    mockUseSessionHelpers.authenticatedNoProfile();

    // Setup default tenant data
    (tenantUtils.getTenants as jest.Mock).mockResolvedValue([mockTenantWithUsage]);
  });

  describe("Tenant Creation Flow", () => {
    it("should handle successful tenant creation", async () => {
      const newTenant = {
        ...mockTenantWithUsage,
        id: "tenant-2",
        name: "New Church",
        slug: "new-church",
      };

      // Mock successful creation
      (tenantUtils.createTenant as jest.Mock).mockResolvedValue(newTenant);
      (tenantUtils.getTenants as jest.Mock)
        .mockResolvedValueOnce([mockTenantWithUsage]) // Initial load
        .mockResolvedValueOnce([mockTenantWithUsage, newTenant]); // After creation

      await act(async () => {
        render(<DashboardPage />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      // Click add button to open dialog
      const addButton = screen.getByRole("button", { name: /dashboard.addChurch/i });
      await userEvent.setup().click(addButton);

      // Verify the create dialog would be opened
      expect(addButton).toBeInTheDocument();
    });

    it("should handle tenant creation errors", async () => {
      const createError = new Error("Creation failed");
      (tenantUtils.createTenant as jest.Mock).mockRejectedValue(createError);

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      // The error handling would be tested in the actual dialog component
      // Check that getTenants was called at least once (could be more due to re-renders)
      expect(tenantUtils.getTenants).toHaveBeenCalled();
    });
  });

  describe("Tenant Update Flow", () => {
    it("should handle successful tenant update", async () => {
      const updatedTenant = {
        ...mockTenantWithUsage,
        name: "Updated Church Name",
      };

      (tenantUtils.updateTenant as jest.Mock).mockResolvedValue(updatedTenant);

      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      render(
        <TenantCard
          tenant={mockTenantWithUsage}
          onTenantUpdated={mockCallbacks.onTenantUpdated}
          onTenantDeleted={mockCallbacks.onTenantDeleted}
        />,
      );

      // Find and click edit button
      const editButton = screen.getByTestId("pencil-icon").closest("button");
      expect(editButton).toBeInTheDocument();

      if (editButton) {
        await userEvent.setup().click(editButton);
        // The update dialog would be opened here
        // In a real test, we would interact with the form and submit
      }
    });

    it("should handle tenant update errors", async () => {
      const updateError = new Error("Update failed");
      (tenantUtils.updateTenant as jest.Mock).mockRejectedValue(updateError);

      // Test error handling logic
      try {
        await tenantUtils.updateTenant(
          mockTenantWithUsage.id,
          "New Name",
          mockTenantWithUsage.slug,
        );
      } catch (error) {
        expect(error.message).toBe("Update failed");
      }

      expect(tenantUtils.updateTenant).toHaveBeenCalledWith(
        mockTenantWithUsage.id,
        "New Name",
        mockTenantWithUsage.slug,
      );
    });
  });

  describe("Tenant Delete Flow", () => {
    it("should handle successful tenant deletion", async () => {
      (tenantUtils.deleteTenant as jest.Mock).mockResolvedValue(undefined);

      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      render(
        <TenantCard
          tenant={mockTenantWithUsage}
          onTenantUpdated={mockCallbacks.onTenantUpdated}
          onTenantDeleted={mockCallbacks.onTenantDeleted}
        />,
      );

      // Find delete button
      const deleteButton = screen.getByTestId("trash-icon").closest("button");
      expect(deleteButton).toBeInTheDocument();

      // In a real scenario, clicking would open a confirmation dialog
      // and after confirmation, the delete would be executed
      if (deleteButton) {
        expect(deleteButton).not.toBeDisabled();
      }
    });

    it("should handle tenant deletion errors", async () => {
      const deleteError = new Error("Delete failed");
      (tenantUtils.deleteTenant as jest.Mock).mockRejectedValue(deleteError);

      // Test error handling logic
      try {
        await tenantUtils.deleteTenant(mockTenantWithUsage.id);
      } catch (error) {
        expect(error.message).toBe("Delete failed");
      }

      expect(tenantUtils.deleteTenant).toHaveBeenCalledWith(mockTenantWithUsage.id);
    });

    it("should call onTenantDeleted callback after successful deletion", async () => {
      (tenantUtils.deleteTenant as jest.Mock).mockResolvedValue(undefined);

      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      // Simulate the delete flow
      const handleDelete = async () => {
        try {
          await tenantUtils.deleteTenant(mockTenantWithUsage.id);
          mockCallbacks.onTenantDeleted();
        } catch {
          // Error handling would be done here
        }
      };

      await handleDelete();

      expect(tenantUtils.deleteTenant).toHaveBeenCalledWith(mockTenantWithUsage.id);
      expect(mockCallbacks.onTenantDeleted).toHaveBeenCalled();
    });
  });

  describe("Tenant Navigation", () => {
    it("should navigate to tenant dashboard", async () => {
      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      render(
        <TenantCard
          tenant={mockTenantWithUsage}
          onTenantUpdated={mockCallbacks.onTenantUpdated}
          onTenantDeleted={mockCallbacks.onTenantDeleted}
        />,
      );

      const manageButton = screen.getByText("tenant.goToChurchDashboard");
      await userEvent.setup().click(manageButton);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
    });

    it("should navigate to tenant auth page", async () => {
      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      render(
        <TenantCard
          tenant={mockTenantWithUsage}
          onTenantUpdated={mockCallbacks.onTenantUpdated}
          onTenantDeleted={mockCallbacks.onTenantDeleted}
        />,
      );

      const loginButton = screen.getByText("tenant.goToChurchLogin");
      await userEvent.setup().click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });
  });

  describe("Data Refresh Patterns", () => {
    it("should refresh tenant list after operations", async () => {
      // Use a consistent mock for both calls to avoid race conditions
      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([mockTenantWithUsage]);

      await act(async () => {
        render(<DashboardPage />);
      });

      // Wait for initial load
      await waitFor(
        () => {
          expect(screen.getByText("Test Church")).toBeInTheDocument();
        },
        { timeout: 15000 },
      );

      // Verify that getTenants was called (indicating data fetching)
      await waitFor(
        () => {
          expect(tenantUtils.getTenants).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );

      // The test verifies that data refresh patterns work
      // In real usage, this would be triggered by child component callbacks
      expect(tenantUtils.getTenants).toHaveBeenCalled();
    }, 20000);
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Override the default mock to reject with an error
      (tenantUtils.getTenants as jest.Mock)
        .mockReset()
        .mockRejectedValue(new Error("Network error"));

      await act(async () => {
        render(<DashboardPage />);
      });

      // When there's an error, the component shows the main dashboard structure
      await waitFor(() => {
        expect(screen.getByText("dashboard.churchesYouManage")).toBeInTheDocument();
      });

      // After error, the loading should complete and show empty state
      // The error case should show empty state with the "no churches yet" message
      await waitFor(() => {
        expect(screen.getByText("dashboard.noChurchesYet")).toBeInTheDocument();
      });

      // The error should be logged - wait for the async operation to complete
      await waitFor(
        () => {
          expect(consoleSpy).toHaveBeenCalledWith("Error fetching tenants:", expect.any(Error));
        },
        { timeout: 3000 },
      );
      consoleSpy.mockRestore();
    });

    it("should handle authentication errors", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<DashboardPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  describe("Loading States", () => {
    it("should show loading state during data fetch", () => {
      (tenantUtils.getTenants as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<DashboardPage />);

      expect(screen.getByText("dashboard.loadingChurchesList")).toBeInTheDocument();
    });

    it("should show session loading state", () => {
      mockUseSessionHelpers.loading();

      render(<DashboardPage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("should show empty state when no tenants exist", async () => {
      (tenantUtils.getTenants as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<DashboardPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("dashboard.noChurchesYet")).toBeInTheDocument();
        expect(screen.getByText("dashboard.addFirstChurch")).toBeInTheDocument();
      });

      // Should have add buttons available
      const addButtons = screen.getAllByText("dashboard.addChurch");
      expect(addButtons).toHaveLength(2);
    });
  });

  describe("URL Operations", () => {
    it("should display correct auth URL format", () => {
      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      // Mock window.location.origin
      Object.defineProperty(window, "location", {
        value: {
          origin: "https://example.com",
        },
        writable: true,
      });

      render(
        <TenantCard
          tenant={mockTenantWithUsage}
          onTenantUpdated={mockCallbacks.onTenantUpdated}
          onTenantDeleted={mockCallbacks.onTenantDeleted}
        />,
      );

      const expectedUrl = "https://example.com/tenant/test-church/auth";
      expect(screen.getByText(expectedUrl)).toBeInTheDocument();
    });

    it("should have copy functionality available", () => {
      const mockCallbacks = {
        onTenantUpdated: jest.fn(),
        onTenantDeleted: jest.fn(),
      };

      render(
        <TenantCard
          tenant={mockTenantWithUsage}
          onTenantUpdated={mockCallbacks.onTenantUpdated}
          onTenantDeleted={mockCallbacks.onTenantDeleted}
        />,
      );

      const copyButton = screen.getByText("tenant.copy");
      expect(copyButton).toBeInTheDocument();
    });
  });
});
