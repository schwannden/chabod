import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockTenant } from "../../test-utils";
import GroupMembersPage from "@/pages/tenant/GroupMembersPage";
import * as tenantUtils from "@/lib/tenant-utils";
import * as groupService from "@/lib/group-service";
import { supabase } from "@/integrations/supabase/client";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ slug: "test-church", groupId: "group-1" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Import useTenantRole hook for mocking
const { useTenantRole } = jest.requireMock("@/hooks/useTenantRole") as {
  useTenantRole: jest.MockedFunction<typeof import("@/hooks/useTenantRole").useTenantRole>;
};

// Mock supabase client
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

// Mock NavBar component
jest.mock("@/components/Layout/NavBar", () => ({
  NavBar: () => <div data-testid="nav-bar">NavBar</div>,
}));

// Mock TenantBreadcrumb component
jest.mock("@/components/Layout/TenantBreadcrumb", () => ({
  TenantBreadcrumb: ({
    tenantName,
    tenantSlug,
    items,
  }: {
    tenantName: string;
    tenantSlug: string;
    items: Array<{ label: string; path?: string }>;
  }) => (
    <div data-testid="tenant-breadcrumb">
      <div data-testid="breadcrumb-tenant-name">{tenantName}</div>
      <div data-testid="breadcrumb-tenant-slug">{tenantSlug}</div>
      <div data-testid="breadcrumb-items">
        {items.map((item, index) => (
          <span key={index} data-testid={`breadcrumb-item-${index}`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  ),
}));

// Mock UI components that are causing issues
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    <div data-testid="dialog" style={{ display: open ? "block" : "none" }}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value: _value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div data-testid="select" onClick={() => onValueChange("user-3")}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value: _value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${_value}`}>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder: string }) => (
    <div data-testid="select-value">{placeholder}</div>
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: React.ReactNode }) => (
    <label data-testid="label">{children}</label>
  ),
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="table">{children}</table>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead data-testid="table-header">{children}</thead>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody data-testid="table-body">{children}</tbody>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr data-testid="table-row">{children}</tr>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th data-testid="table-head">{children}</th>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td data-testid="table-cell">{children}</td>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <svg data-testid="loader" className={className}>
      <circle />
    </svg>
  ),
  UserMinus: ({ className }: { className?: string }) => (
    <svg data-testid="user-minus" className={className}>
      <path />
    </svg>
  ),
}));

// Mock the service functions
jest.mock("@/lib/tenant-utils", () => ({
  getTenantBySlug: jest.fn(),
  getTenantMembers: jest.fn(),
}));

jest.mock("@/lib/group-service", () => ({
  getGroupMembers: jest.fn(),
  addUserToGroup: jest.fn(),
  removeUserFromGroup: jest.fn(),
}));

// Mock useTenantRole hook
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(),
}));

describe("GroupMembersPage", () => {
  // Using mock data from test-utils.tsx

  const mockGroup = {
    id: "group-1",
    name: "Youth Group",
    description: "For young people",
    tenant_id: "tenant-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockGroupMembers = [
    {
      id: "member-1",
      group_id: "group-1",
      user_id: "user-1",
      created_at: "2024-01-01T00:00:00Z",
      profile: {
        id: "user-1",
        full_name: "John Doe",
        email: "john@example.com",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: "member-2",
      group_id: "group-1",
      user_id: "user-2",
      created_at: "2024-01-01T00:00:00Z",
      profile: {
        id: "user-2",
        full_name: "Jane Smith",
        email: "jane@example.com",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
  ];

  const mockTenantMembers = [
    {
      id: "tenant-member-1",
      tenant_id: "tenant-1",
      user_id: "user-3",
      role: "member",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      profile: {
        id: "user-3",
        full_name: "Bob Wilson",
        email: "bob@example.com",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church", groupId: "group-1" });

    // Set up default mocks
    (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(mockTenant);
    (tenantUtils.getTenantMembers as jest.Mock).mockResolvedValue(mockTenantMembers);
    (groupService.getGroupMembers as jest.Mock).mockResolvedValue(mockGroupMembers);
    useTenantRole.mockReturnValue({ role: "member", isLoading: false });

    // Default authenticated user
    mockUseSessionHelpers.authenticatedNoProfile();

    // Mock supabase group query
    const mockSupabaseQuery = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockGroup,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from = mockSupabaseQuery.from;
  });

  describe("Authentication and Authorization", () => {
    it("should redirect to auth page if user is not authenticated", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<GroupMembersPage />);
      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should not redirect if session is loading", () => {
      mockUseSessionHelpers.loading();
      render(<GroupMembersPage />);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should not show add/remove controls for members", async () => {
      useTenantRole.mockReturnValue({ role: "member", isLoading: false });
      render(<GroupMembersPage />);
      await waitFor(() => {
        expect(screen.queryByText("groups.addMember")).not.toBeInTheDocument();
        expect(screen.queryByTestId("user-minus")).not.toBeInTheDocument();
      });
    });

    it("should show add/remove controls for owners", async () => {
      useTenantRole.mockReturnValue({ role: "owner", isLoading: false });
      render(<GroupMembersPage />);
      await waitFor(() => {
        expect(screen.getByText("groups.addMember")).toBeInTheDocument();
        expect(screen.getAllByTestId("user-minus").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Data Loading and Error Handling", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should show loading state while fetching data", async () => {
      // Mock pending promise
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      await act(async () => {
        render(<GroupMembersPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should navigate to not-found when tenant doesn't exist", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/not-found");
      });
    });

    it("should navigate back to tenant when group doesn't exist", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const mockSupabaseQuery = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error("Group not found"),
              }),
            })),
          })),
        })),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from = mockSupabaseQuery.from;

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching group:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should handle data fetching errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantUtils.getTenantBySlug as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching data:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Data Display", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should display group members correctly", async () => {
      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.groupMembers")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      });
    });

    it("should display breadcrumbs correctly", async () => {
      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("breadcrumb-tenant-name")).toHaveTextContent("Test Church");
        expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent("groups.groups");
        expect(screen.getByTestId("breadcrumb-item-1")).toHaveTextContent("groups.members");
      });
    });

    it("should show back to groups button", async () => {
      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.backToGroups")).toBeInTheDocument();
      });
    });

    it("should show empty state when no members", async () => {
      (groupService.getGroupMembers as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.noMembersInGroup")).toBeInTheDocument();
      });
    });

    it("should show unknown for members without profile name", async () => {
      const membersWithoutNames = [
        {
          ...mockGroupMembers[0],
          profile: { ...mockGroupMembers[0].profile, full_name: null },
        },
      ];
      (groupService.getGroupMembers as jest.Mock).mockResolvedValue(membersWithoutNames);

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.unknown")).toBeInTheDocument();
      });
    });
  });

  describe("Member Management", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
      useTenantRole.mockReturnValue({ role: "owner", isLoading: false });
    });

    it("should open add member dialog when button is clicked", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.addMember")).toBeInTheDocument();
      });

      const addButton = screen.getByText("groups.addMember");
      await user.click(addButton);

      expect(screen.getByText("groups.addMemberToGroup")).toBeInTheDocument();
    });

    it("should add member successfully", async () => {
      const user = userEvent.setup();
      (groupService.addUserToGroup as jest.Mock).mockResolvedValue({});

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.addMember")).toBeInTheDocument();
      });

      const addButton = screen.getByText("groups.addMember");
      await user.click(addButton);

      // Select a member (our mock automatically selects user-3)
      const select = screen.getByTestId("select");
      await user.click(select);

      // Submit
      const submitButton = screen.getByText("groups.addToGroup");
      await user.click(submitButton);

      await waitFor(() => {
        expect(groupService.addUserToGroup).toHaveBeenCalledWith("group-1", "user-3");
      });
    });

    it("should handle add member failure", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (groupService.addUserToGroup as jest.Mock).mockRejectedValue(new Error("Add failed"));

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.addMember")).toBeInTheDocument();
      });

      const addButton = screen.getByText("groups.addMember");
      await user.click(addButton);

      // Select a member (our mock automatically selects user-3)
      const select = screen.getByTestId("select");
      await user.click(select);

      // Submit
      const submitButton = screen.getByText("groups.addToGroup");
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to add member:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("should remove member successfully", async () => {
      const user = userEvent.setup();
      (groupService.removeUserFromGroup as jest.Mock).mockResolvedValue({});

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getAllByText("groups.remove")).toHaveLength(2);
      });

      const removeButtons = screen.getAllByText("groups.remove");
      await user.click(removeButtons[0]); // Click the first remove button

      await waitFor(() => {
        expect(groupService.removeUserFromGroup).toHaveBeenCalledWith("member-1");
      });
    });

    it("should handle remove member failure", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (groupService.removeUserFromGroup as jest.Mock).mockRejectedValue(new Error("Remove failed"));

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getAllByText("groups.remove")).toHaveLength(2);
      });

      const removeButtons = screen.getAllByText("groups.remove");
      await user.click(removeButtons[0]); // Click the first remove button

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to remove member:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("should disable add member button when no available members", async () => {
      (tenantUtils.getTenantMembers as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        const addButton = screen.getByText("groups.addMember");
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe("Navigation Actions", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should navigate back to groups when back button is clicked", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.backToGroups")).toBeInTheDocument();
      });

      const backButton = screen.getByText("groups.backToGroups");
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/groups");
    });
  });

  describe("Loading States", () => {
    it("should show session loading state", async () => {
      mockUseSessionHelpers.loading();

      await act(async () => {
        render(<GroupMembersPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should show data loading state", async () => {
      // Mock pending promise to simulate loading
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<GroupMembersPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should handle missing slug parameter", async () => {
      mockUseParams.mockReturnValue({ slug: undefined, groupId: "group-1" });

      await act(async () => {
        render(<GroupMembersPage />);
      });

      // Should not call data fetching functions with undefined slug
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });

    it("should handle missing groupId parameter", async () => {
      mockUseParams.mockReturnValue({ slug: "test-church", groupId: undefined });

      await act(async () => {
        render(<GroupMembersPage />);
      });

      // Should not call data fetching functions with undefined groupId
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });

    it("should not fetch data when user is null", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<GroupMembersPage />);
      });

      // Should redirect instead of fetching data
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should handle rapid state changes during data loading", async () => {
      // Start with loading tenant
      let resolvePromise: (value: typeof mockTenant) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (tenantUtils.getTenantBySlug as jest.Mock).mockReturnValue(pendingPromise);

      let rerender: (ui: React.ReactElement) => void;
      await act(async () => {
        const result = render(<GroupMembersPage />);
        rerender = result.rerender;
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();

      // Resolve the promise to simulate data loading
      await act(async () => {
        resolvePromise!(mockTenant);
        rerender(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-breadcrumb")).toBeInTheDocument();
      });
    });

    it("should handle members with null profile", async () => {
      const membersWithNullProfile = [
        {
          ...mockGroupMembers[0],
          profile: null,
        },
      ];
      (groupService.getGroupMembers as jest.Mock).mockResolvedValue(membersWithNullProfile);

      await act(async () => {
        render(<GroupMembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("groups.unknown")).toBeInTheDocument();
        expect(screen.getByText("groups.noEmail")).toBeInTheDocument();
      });
    });
  });
});
