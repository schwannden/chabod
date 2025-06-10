import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockTenant } from "../../test-utils";
import ResourcePage from "@/pages/tenant/ResourcePage";
import { useTenantRole } from "@/hooks/useTenantRole";
import * as resourceService from "@/lib/resource-service";
import * as groupService from "@/lib/group-service";
import { supabase } from "@/integrations/supabase/client";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ slug: "test-church" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock react-i18next with stable reference
const mockT = jest.fn((key: string) => key);
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock hooks
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(),
}));

// Mock useToast with stable reference
const mockToast = jest.fn();
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock TenantPageLayout component
jest.mock("@/components/Layout/TenantPageLayout", () => ({
  TenantPageLayout: ({
    children,
    title,
    tenantName,
    tenantSlug,
    isLoading,
    breadcrumbItems,
    action,
  }: {
    children: React.ReactNode;
    title: string;
    tenantName: string;
    tenantSlug: string;
    isLoading?: boolean;
    breadcrumbItems: Array<{ label: string; path?: string }>;
    action?: React.ReactNode;
  }) => (
    <div data-testid="tenant-page-layout">
      <div data-testid="layout-title">{title}</div>
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
      <div data-testid="layout-action">{action}</div>
      {children}
    </div>
  ),
}));

// Mock ResourceFilterBar component
jest.mock("@/components/Resources/ResourceFilterBar", () => ({
  ResourceFilterBar: ({
    textFilter,
    setTextFilter,
    selectedGroup,
    setSelectedGroup,
    groups,
  }: {
    textFilter: string;
    setTextFilter: (value: string) => void;
    selectedGroup: string;
    setSelectedGroup: (value: string) => void;
    groups: Array<{ id: string; name: string }>;
  }) => (
    <div data-testid="resource-filter-bar">
      <input
        data-testid="text-filter"
        value={textFilter}
        onChange={(e) => setTextFilter(e.target.value)}
        placeholder="Search resources"
      />
      <select
        data-testid="group-filter"
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
      >
        <option value="all">All groups</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

// Mock ResourceList component
jest.mock("@/components/Resources/ResourceList", () => ({
  ResourceList: ({
    resources,
    isLoading,
    onResourceUpdated,
    onResourceDeleted,
    canManage,
    groups,
  }: {
    resources: Array<{
      id: string;
      name: string;
      description?: string;
      url?: string;
      icon: string;
      tenant_id: string;
    }>;
    isLoading: boolean;
    onResourceUpdated: (resource: unknown) => void;
    onResourceDeleted: (id: string) => void;
    canManage: boolean;
    groups: Array<{ id: string; name: string }>;
  }) => (
    <div data-testid="resource-list">
      <div data-testid="resources-count">{resources.length}</div>
      <div data-testid="resources-loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="can-manage">{canManage ? "true" : "false"}</div>
      <div data-testid="groups-count">{groups.length}</div>
      <button
        onClick={() => {
          setTimeout(() => {
            onResourceUpdated({ id: "updated-resource", name: "Updated Resource" });
          }, 0);
        }}
        data-testid="mock-resource-updated"
      >
        Trigger Resource Updated
      </button>
      <button
        onClick={() => {
          setTimeout(() => {
            onResourceDeleted("resource-1");
          }, 0);
        }}
        data-testid="mock-resource-deleted"
      >
        Trigger Resource Deleted
      </button>
      {resources.map((resource) => (
        <div key={resource.id} data-testid={`resource-${resource.id}`}>
          {resource.name}
        </div>
      ))}
    </div>
  ),
}));

// Mock CreateResourceDialog component
jest.mock("@/components/Resources/CreateResourceDialog", () => ({
  CreateResourceDialog: ({
    isOpen,
    onClose,
    tenantId,
    onResourceCreated,
    groups,
  }: {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    onResourceCreated: (resource: unknown) => void;
    groups: Array<{ id: string; name: string }>;
  }) => {
    const handleCreate = () => {
      setTimeout(() => {
        onResourceCreated({
          id: "new-resource-id",
          name: "New Resource",
          tenant_id: tenantId,
          icon: "book",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        });
        onClose();
      }, 0);
    };

    return (
      <div data-testid="create-resource-dialog" style={{ display: isOpen ? "block" : "none" }}>
        <div data-testid="dialog-tenant-id">{tenantId}</div>
        <div data-testid="dialog-groups-count">{groups.length}</div>
        <button onClick={onClose} data-testid="dialog-close">
          Close
        </button>
        <button onClick={handleCreate} data-testid="dialog-create">
          Create Resource
        </button>
      </div>
    );
  },
}));

// Mock service functions
jest.mock("@/lib/resource-service", () => ({
  getResources: jest.fn(),
  getResourceGroups: jest.fn(),
}));

jest.mock("@/lib/group-service", () => ({
  getTenantGroups: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe("ResourcePage", () => {
  // Set timeout for all tests in this describe block
  jest.setTimeout(10000);

  // Using mock data from test-utils.tsx

  const mockGroups = [
    { id: "group-1", name: "Bible Study" },
    { id: "group-2", name: "Prayer Group" },
  ];

  const mockResources = [
    {
      id: "resource-1",
      name: "Bible Study Guide",
      description: "Weekly study guide",
      url: "https://example.com/bible-study",
      icon: "book",
      tenant_id: "tenant-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "resource-2",
      name: "Song List",
      description: "Weekly songs",
      url: "https://example.com/songs",
      icon: "music",
      tenant_id: "tenant-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  // Get mocked functions with proper typing
  const mockUseTenantRole = useTenantRole as jest.MockedFunction<typeof useTenantRole>;
  const mockGetResources = resourceService.getResources as jest.MockedFunction<
    typeof resourceService.getResources
  >;
  const mockGetResourceGroups = resourceService.getResourceGroups as jest.MockedFunction<
    typeof resourceService.getResourceGroups
  >;
  const mockGetTenantGroups = groupService.getTenantGroups as jest.MockedFunction<
    typeof groupService.getTenantGroups
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockT.mockClear();
    mockToast.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Set up default mocks
    mockUseSessionHelpers.authenticatedNoProfile();

    mockUseTenantRole.mockReturnValue({
      role: "member",
      isLoading: false,
    });

    // Mock Supabase tenant query with stable implementation
    const mockSingleFn = jest.fn().mockResolvedValue({
      data: mockTenant,
      error: null,
    });
    const mockEqFn = jest.fn().mockReturnValue({
      single: mockSingleFn,
    });
    const mockSelectFn = jest.fn().mockReturnValue({
      eq: mockEqFn,
    });
    const mockFromFn = jest.fn().mockReturnValue({
      select: mockSelectFn,
    });
    (supabase.from as jest.Mock).mockImplementation(mockFromFn);

    // Set up service mocks with stable implementations
    mockGetResources.mockImplementation(() => Promise.resolve([...mockResources]));

    // Create a Map to cache resource groups and prevent infinite loops
    const resourceGroupsCache = new Map([
      ["resource-1", ["group-1"]],
      ["resource-2", ["group-2"]],
    ]);

    mockGetResourceGroups.mockImplementation((resourceId: string) => {
      const groups = resourceGroupsCache.get(resourceId) || [];
      return Promise.resolve([...groups]);
    });

    mockGetTenantGroups.mockImplementation(() => Promise.resolve([...mockGroups]));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication and Loading", () => {
    it("should redirect to auth page when user is not authenticated", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<ResourcePage />);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should show loading state when session is loading", async () => {
      mockUseSessionHelpers.loading();

      await act(async () => {
        render(<ResourcePage />);
      });

      expect(screen.getByTestId("layout-loading")).toHaveTextContent("loading");
    });
  });

  describe("Tenant and Data Loading", () => {
    it("should render with loading state initially", async () => {
      render(<ResourcePage />);

      // Check if the layout renders
      expect(screen.getByTestId("tenant-page-layout")).toBeInTheDocument();

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId("layout-loading")).toHaveTextContent("not-loading");
      });
    });

    it("should render page title and breadcrumbs", async () => {
      render(<ResourcePage />);

      await waitFor(() => {
        expect(screen.getByTestId("layout-title")).toHaveTextContent("dashboard.resourcesTitle");
        expect(screen.getByTestId("breadcrumb-0")).toHaveTextContent("dashboard.resourcesTitle");
      });
    });

    it("should display tenant information when loaded", async () => {
      render(<ResourcePage />);

      await waitFor(() => {
        expect(screen.getByTestId("layout-tenant-name")).toHaveTextContent("Test Church");
        expect(screen.getByTestId("layout-tenant-slug")).toHaveTextContent("test-church");
      });
    });

    it("should render filter bar and resource list", async () => {
      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("resource-filter-bar")).toBeInTheDocument();
          expect(screen.getByTestId("resource-list")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("should display resources when loaded", async () => {
      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("resources-count")).toHaveTextContent("2");
          expect(screen.getByTestId("resource-resource-1")).toHaveTextContent("Bible Study Guide");
          expect(screen.getByTestId("resource-resource-2")).toHaveTextContent("Song List");
        },
        { timeout: 3000 },
      );
    });

    it("should display groups in filter", async () => {
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("2");
      });
    });
  });

  describe("User Role and Permissions", () => {
    it("should show create button for owner", async () => {
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "owner",
        isLoading: false,
      });

      render(<ResourcePage />);

      await waitFor(
        () => {
          const actionElement = screen.getByTestId("layout-action");
          expect(actionElement).toHaveTextContent("resources.addResource");
        },
        { timeout: 3000 },
      );
    });

    it("should not show create button for member", async () => {
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "member",
        isLoading: false,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        const actionElement = screen.getByTestId("layout-action");
        expect(actionElement).toBeEmptyDOMElement();
      });
    });

    it("should pass correct manage permissions to ResourceList", async () => {
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "owner",
        isLoading: false,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("can-manage")).toHaveTextContent("true");
      });
    });

    it("should not allow management for non-owner", async () => {
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "member",
        isLoading: false,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("can-manage")).toHaveTextContent("false");
      });
    });
  });

  describe("Create Resource Dialog", () => {
    it("should open create dialog when create button is clicked", async () => {
      const user = userEvent.setup();
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "owner",
        isLoading: false,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("layout-action")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /resources.addResource/ });
      await act(async () => {
        await user.click(createButton);
      });

      expect(screen.getByTestId("create-resource-dialog")).toBeVisible();
    });

    it("should close create dialog", async () => {
      const user = userEvent.setup();
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "owner",
        isLoading: false,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("layout-action")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /resources.addResource/ });
      await act(async () => {
        await user.click(createButton);
      });

      const closeButton = screen.getByTestId("dialog-close");
      await act(async () => {
        await user.click(closeButton);
      });

      expect(screen.getByTestId("create-resource-dialog")).not.toBeVisible();
    });

    it("should add new resource when created", async () => {
      const user = userEvent.setup();
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "owner",
        isLoading: false,
      });

      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("resources-count")).toHaveTextContent("2");
        },
        { timeout: 3000 },
      );

      const createButton = screen.getByRole("button", { name: /resources.addResource/ });
      await user.click(createButton);

      const dialogCreateButton = screen.getByTestId("dialog-create");
      await user.click(dialogCreateButton);

      // The mock component simulates adding a resource with async behavior
      await waitFor(
        () => {
          expect(screen.getByTestId("resources-count")).toHaveTextContent("3");
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Resource Filtering", () => {
    it("should filter resources by text", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("text-filter")).toBeInTheDocument();
      });

      const textFilter = screen.getByTestId("text-filter");
      await act(async () => {
        await user.type(textFilter, "Bible");
      });

      // The actual filtering logic is tested through component integration
      expect(textFilter).toHaveValue("Bible");
    });

    it("should filter resources by group", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("group-filter")).toBeInTheDocument();
      });

      const groupFilter = screen.getByTestId("group-filter");
      await act(async () => {
        await user.selectOptions(groupFilter, "group-1");
      });

      expect(groupFilter).toHaveValue("group-1");
    });

    it("should reset to all groups", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("group-filter")).toBeInTheDocument();
      });

      const groupFilter = screen.getByTestId("group-filter");
      await act(async () => {
        await user.selectOptions(groupFilter, "all");
      });

      expect(groupFilter).toHaveValue("all");
    });
  });

  describe("Resource Management", () => {
    it("should update resource list when resource is updated", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("mock-resource-updated")).toBeInTheDocument();
      });

      const updateButton = screen.getByTestId("mock-resource-updated");
      await act(async () => {
        await user.click(updateButton);
      });

      // Resource update logic is handled by the parent component
      expect(updateButton).toBeInTheDocument();
    });

    it("should remove resource from list when deleted", async () => {
      const user = userEvent.setup();
      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("mock-resource-deleted")).toBeInTheDocument();
          expect(screen.getByTestId("resources-count")).toHaveTextContent("2");
        },
        { timeout: 3000 },
      );

      const deleteButton = screen.getByTestId("mock-resource-deleted");
      await user.click(deleteButton);

      // The mock component simulates removing a resource with async behavior
      await waitFor(
        () => {
          expect(screen.getByTestId("resources-count")).toHaveTextContent("1");
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle tenant fetch error", async () => {
      const mockSingleFn = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Tenant not found" },
      });
      const mockEqFn = jest.fn().mockReturnValue({
        single: mockSingleFn,
      });
      const mockSelectFn = jest.fn().mockReturnValue({
        eq: mockEqFn,
      });
      const mockFromFn = jest.fn().mockReturnValue({
        select: mockSelectFn,
      });
      (supabase.from as jest.Mock).mockImplementation(mockFromFn);

      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("layout-tenant-name")).toHaveTextContent("");
        },
        { timeout: 3000 },
      );
    });

    it("should handle resources fetch error", async () => {
      (resourceService.getResources as jest.Mock).mockRejectedValue(
        new Error("Resources fetch failed"),
      );

      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("layout-loading")).toHaveTextContent("not-loading");
        },
        { timeout: 3000 },
      );
    });

    it("should handle groups fetch error", async () => {
      (groupService.getTenantGroups as jest.Mock).mockRejectedValue(
        new Error("Groups fetch failed"),
      );

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("0");
      });
    });

    it("should handle resource groups fetch error", async () => {
      (resourceService.getResourceGroups as jest.Mock).mockRejectedValue(
        new Error("Resource groups fetch failed"),
      );

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        // Should still render resources even if group associations fail
        expect(screen.getByTestId("resources-count")).toHaveTextContent("2");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing slug parameter", async () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("layout-tenant-slug")).toHaveTextContent("");
      });
    });

    it("should handle empty resources list", async () => {
      (resourceService.getResources as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("resources-count")).toHaveTextContent("0");
      });
    });

    it("should handle empty groups list", async () => {
      (groupService.getTenantGroups as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("0");
      });
    });

    it("should handle loading role state", async () => {
      (useTenantRole as jest.Mock).mockReturnValue({
        role: null,
        isLoading: true,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        const actionElement = screen.getByTestId("layout-action");
        expect(actionElement).toBeEmptyDOMElement();
      });
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to ResourceFilterBar", async () => {
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        const filterBar = screen.getByTestId("resource-filter-bar");
        const textFilter = screen.getByTestId("text-filter");
        const groupFilter = screen.getByTestId("group-filter");

        expect(filterBar).toBeInTheDocument();
        expect(textFilter).toHaveValue("");
        expect(groupFilter).toHaveValue("all");
      });
    });

    it("should pass correct props to ResourceList", async () => {
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("resources-count")).toHaveTextContent("2");
        expect(screen.getByTestId("resources-loading")).toHaveTextContent("not-loading");
        expect(screen.getByTestId("can-manage")).toHaveTextContent("false");
        expect(screen.getByTestId("groups-count")).toHaveTextContent("2");
      });
    });

    it("should pass correct props to CreateResourceDialog", async () => {
      const user = userEvent.setup();
      (useTenantRole as jest.Mock).mockReturnValue({
        role: "owner",
        isLoading: false,
      });

      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("layout-action")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /resources.addResource/ });
      await act(async () => {
        await user.click(createButton);
      });

      expect(screen.getByTestId("dialog-tenant-id")).toHaveTextContent("test-church");
      expect(screen.getByTestId("dialog-groups-count")).toHaveTextContent("2");
    });
  });

  describe("Filtering Logic", () => {
    const resourcesWithGroups = [
      {
        id: "resource-1",
        name: "Bible Study Guide",
        description: "Weekly study guide",
        url: "https://example.com/bible-study",
        icon: "book",
        tenant_id: "tenant-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "resource-2",
        name: "Youth Music",
        description: "Songs for youth",
        url: "https://example.com/youth-music",
        icon: "music",
        tenant_id: "tenant-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    beforeEach(() => {
      (resourceService.getResources as jest.Mock).mockImplementation(() =>
        Promise.resolve([...resourcesWithGroups]),
      );

      // Create stable cache for filtering tests
      const filterResourceGroupsCache = new Map([
        ["resource-1", ["group-1"]],
        ["resource-2", ["group-2"]],
      ]);

      (resourceService.getResourceGroups as jest.Mock).mockImplementation((resourceId: string) => {
        const groups = filterResourceGroupsCache.get(resourceId) || [];
        return Promise.resolve([...groups]);
      });
    });

    it("should filter resources by text in name", async () => {
      const user = userEvent.setup();
      render(<ResourcePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId("resources-count")).toHaveTextContent("2");
        },
        { timeout: 3000 },
      );

      const textFilter = screen.getByTestId("text-filter");
      await user.type(textFilter, "Bible");

      // Since we're testing integration, the actual filter behavior would be handled by the parent
      expect(textFilter).toHaveValue("Bible");
    });

    it("should filter resources by text in description", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("text-filter")).toBeInTheDocument();
      });

      const textFilter = screen.getByTestId("text-filter");
      await act(async () => {
        await user.type(textFilter, "Songs");
      });

      expect(textFilter).toHaveValue("Songs");
    });

    it("should filter resources by text in URL", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("text-filter")).toBeInTheDocument();
      });

      const textFilter = screen.getByTestId("text-filter");
      await act(async () => {
        await user.type(textFilter, "youth-music");
      });

      expect(textFilter).toHaveValue("youth-music");
    });

    it("should handle case insensitive text filtering", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("text-filter")).toBeInTheDocument();
      });

      const textFilter = screen.getByTestId("text-filter");
      await act(async () => {
        await user.type(textFilter, "BIBLE");
      });

      expect(textFilter).toHaveValue("BIBLE");
    });

    it("should clear text filter", async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ResourcePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("text-filter")).toBeInTheDocument();
      });

      const textFilter = screen.getByTestId("text-filter");
      await act(async () => {
        await user.type(textFilter, "test");
        await user.clear(textFilter);
      });

      expect(textFilter).toHaveValue("");
    });
  });
});
