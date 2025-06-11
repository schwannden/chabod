import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockTenant } from "../../test-utils";
import GroupsPage from "@/pages/tenant/GroupsPage";
import * as tenantUtils from "@/lib/tenant-utils";
import * as groupService from "@/lib/group-service";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ slug: "test-church" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Import useTenantRole hook for mocking
const { useTenantRole } = jest.requireMock("@/hooks/useTenantRole") as {
  useTenantRole: jest.MockedFunction<typeof import("@/hooks/useTenantRole").useTenantRole>;
};

// Mock TenantPageLayout component
jest.mock("@/components/Layout/TenantPageLayout", () => ({
  TenantPageLayout: ({
    children,
    title,
    description,
    tenantName,
    tenantSlug,
    isLoading,
    breadcrumbItems,
  }: {
    children: React.ReactNode;
    title: string;
    description?: string;
    tenantName: string;
    tenantSlug: string;
    isLoading?: boolean;
    breadcrumbItems: Array<{ label: string; path?: string }>;
  }) => (
    <div data-testid="tenant-page-layout">
      <div data-testid="layout-title">{title}</div>
      <div data-testid="layout-description">{description}</div>
      <div data-testid="layout-tenant-name">{tenantName}</div>
      <div data-testid="layout-tenant-slug">{tenantSlug}</div>
      <div data-testid="layout-loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="layout-breadcrumbs">
        {breadcrumbItems.map((item, index) => (
          <span key={index} data-testid={`breadcrumb-${index}`}>
            {item.label}
          </span>
        ))}
      </div>
      {children}
    </div>
  ),
}));

// Mock GroupTable component
jest.mock("@/components/Groups/GroupTable", () => ({
  GroupTable: ({
    groups,
    tenantId,
    isTenantOwner,
    onGroupCreated,
    onGroupUpdated,
    onGroupDeleted,
  }: {
    groups: Array<{
      id: string;
      name: string;
      description: string;
      tenant_id: string;
      created_at: string;
      updated_at: string;
      memberCount: number;
    }>;
    tenantId: string;
    isTenantOwner: boolean;
    onGroupCreated: () => void;
    onGroupUpdated: () => void;
    onGroupDeleted: () => void;
  }) => (
    <div data-testid="group-table">
      <div data-testid="groups-count">{groups.length}</div>
      <div data-testid="tenant-id">{tenantId}</div>
      <div data-testid="is-owner">{isTenantOwner ? "true" : "false"}</div>
      <button onClick={onGroupCreated} data-testid="mock-group-created">
        Trigger Group Created
      </button>
      <button onClick={onGroupUpdated} data-testid="mock-group-updated">
        Trigger Group Updated
      </button>
      <button onClick={onGroupDeleted} data-testid="mock-group-deleted">
        Trigger Group Deleted
      </button>
    </div>
  ),
}));

// Mock the service functions
jest.mock("@/lib/tenant-utils", () => ({
  getTenantBySlug: jest.fn(),
}));

jest.mock("@/lib/group-service", () => ({
  getTenantGroups: jest.fn(),
}));

// Mock useTenantRole hook
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(),
}));

describe("GroupsPage", () => {
  const mockGroups = [
    {
      id: "group-1",
      name: "Youth Group",
      description: "For young people",
      tenant_id: "test-tenant-id",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      memberCount: 5,
    },
    {
      id: "group-2",
      name: "Seniors Group",
      description: "For older members",
      tenant_id: "test-tenant-id",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      memberCount: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Set up default mocks
    (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(mockTenant);
    (groupService.getTenantGroups as jest.Mock).mockResolvedValue(mockGroups);
    useTenantRole.mockReturnValue({ role: "member", isLoading: false });

    // Default authenticated user
    mockUseSessionHelpers.authenticatedNoProfile();
  });

  describe("Authentication and Navigation", () => {
    it("should redirect to auth page when user is not authenticated", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<GroupsPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should not redirect when session is loading", () => {
      mockUseSessionHelpers.loading();

      render(<GroupsPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should not redirect when user is authenticated", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<GroupsPage />);
      });

      expect(mockNavigate).not.toHaveBeenCalledWith("/tenant/test-church/auth");
    });
  });

  describe("Tenant Loading and Error Handling", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should show loading state while fetching tenant", async () => {
      // Mock pending promise that never resolves to simulate loading
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<GroupsPage />);

      expect(screen.getByText("common:loading")).toBeInTheDocument();
    });

    it("should navigate to not-found when tenant doesn't exist", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/not-found");
      });
    });

    it("should handle tenant fetching errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantUtils.getTenantBySlug as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching tenant or groups:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Data Fetching and Display", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should fetch and display tenant and groups data", async () => {
      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-page-layout")).toBeInTheDocument();
        expect(screen.getByTestId("group-table")).toBeInTheDocument();
      });

      expect(screen.getByTestId("layout-title")).toHaveTextContent("groups:manageGroups");
      expect(screen.getByTestId("layout-description")).toHaveTextContent(
        "groups:manageGroupsDescription",
      );
      expect(screen.getByTestId("layout-tenant-name")).toHaveTextContent("Test Church");
      expect(screen.getByTestId("layout-tenant-slug")).toHaveTextContent("test-church");
      expect(screen.getByTestId("groups-count")).toHaveTextContent("2");
      expect(screen.getByTestId("tenant-id")).toHaveTextContent("test-tenant-id");
    });

    it("should pass correct owner status to GroupTable", async () => {
      useTenantRole.mockReturnValue({ role: "owner", isLoading: false });

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-owner")).toHaveTextContent("true");
      });
    });

    it("should pass non-owner status to GroupTable", async () => {
      useTenantRole.mockReturnValue({ role: "member", isLoading: false });

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-owner")).toHaveTextContent("false");
      });
    });

    it("should display breadcrumb items correctly", async () => {
      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("breadcrumb-0")).toHaveTextContent("groups:groups");
      });
    });
  });

  describe("Group Management Callbacks", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should refresh groups when group is created", async () => {
      const user = userEvent.setup();
      const updatedGroups = [
        ...mockGroups,
        {
          id: "group-3",
          name: "New Group",
          description: "Newly created",
          tenant_id: "test-tenant-id",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          memberCount: 0,
        },
      ];

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("group-table")).toBeInTheDocument();
      });

      // Mock updated groups data
      (groupService.getTenantGroups as jest.Mock).mockResolvedValue(updatedGroups);

      const createButton = screen.getByTestId("mock-group-created");
      await user.click(createButton);

      await waitFor(() => {
        expect(groupService.getTenantGroups).toHaveBeenCalledWith("test-tenant-id");
      });
    });

    it("should refresh groups when group is updated", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("group-table")).toBeInTheDocument();
      });

      const updateButton = screen.getByTestId("mock-group-updated");
      await user.click(updateButton);

      await waitFor(() => {
        expect(groupService.getTenantGroups).toHaveBeenCalledWith("test-tenant-id");
      });
    });

    it("should refresh groups when group is deleted", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("group-table")).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId("mock-group-deleted");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(groupService.getTenantGroups).toHaveBeenCalledWith("test-tenant-id");
      });
    });
  });

  describe("Loading States", () => {
    it("should show session loading state", async () => {
      mockUseSessionHelpers.loading();

      await act(async () => {
        render(<GroupsPage />);
      });

      expect(screen.getByText("common:loading")).toBeInTheDocument();
    });

    it("should show data loading state", async () => {
      // Mock pending promise to simulate loading
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<GroupsPage />);

      expect(screen.getByText("common:loading")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should handle missing slug parameter", async () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      await act(async () => {
        render(<GroupsPage />);
      });

      // Should not call getTenantBySlug with undefined slug
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });

    it("should handle empty groups list", async () => {
      (groupService.getTenantGroups as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("0");
      });
    });

    it("should handle groups fetching errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (groupService.getTenantGroups as jest.Mock).mockRejectedValue(
        new Error("Groups fetch failed"),
      );

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching tenant or groups:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it("should handle role loading state", async () => {
      useTenantRole.mockReturnValue({ role: null, isLoading: true });

      await act(async () => {
        render(<GroupsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common:loading")).toBeInTheDocument();
      });
    });

    it("should not fetch data when user is null", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<GroupsPage />);
      });

      // Should redirect instead of fetching data
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should handle rapid state changes during data loading", async () => {
      // Start with loading tenant
      let resolvePromise: (value: typeof mockTenant) => void;
      const pendingPromise = new Promise<typeof mockTenant>((resolve) => {
        resolvePromise = resolve;
      });

      (tenantUtils.getTenantBySlug as jest.Mock).mockReturnValue(pendingPromise);

      render(<GroupsPage />);

      expect(screen.getByText("common:loading")).toBeInTheDocument();

      // Resolve the promise to simulate data loading
      await act(async () => {
        resolvePromise!(mockTenant);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-page-layout")).toBeInTheDocument();
      });
    });
  });
});
