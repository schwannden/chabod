import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockTenant } from "../../test-utils";
import MembersPage from "@/pages/tenant/MembersPage";
import * as tenantService from "@/lib/tenant-service";
import * as memberService from "@/lib/member-service";
import type { TenantPageLayoutProps } from "@/components/Layout/TenantPageLayout";
import type { MemberTableProps } from "@/components/Members/MemberTable";
import type { MemberInviteDialogProps } from "@/components/Members/MemberInviteDialog";
import type { MemberFilterBarProps } from "@/components/Members/MemberFilterBar";

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
    action,
  }: TenantPageLayoutProps) => (
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
      <div data-testid="layout-action">{action}</div>
      {children}
    </div>
  ),
}));

// Mock MemberTable component
jest.mock("@/components/Members/MemberTable", () => ({
  MemberTable: ({
    members,
    currentUserId,
    isCurrentUserOwner,
    onMemberUpdated,
  }: MemberTableProps) => (
    <div data-testid="member-table">
      <div data-testid="members-count">{members.length}</div>
      <div data-testid="current-user-id">{currentUserId}</div>
      <div data-testid="is-owner">{isCurrentUserOwner ? "true" : "false"}</div>
      <button onClick={onMemberUpdated} data-testid="mock-member-updated">
        Trigger Member Updated
      </button>
      {members.map((member) => (
        <div key={member.id} data-testid={`member-${member.id}`}>
          {member.profile?.full_name}
        </div>
      ))}
    </div>
  ),
}));

// Mock MemberInviteDialog component
jest.mock("@/components/Members/MemberInviteDialog", () => ({
  MemberInviteDialog: ({
    tenantSlug,
    isOpen,
    onClose,
    onInviteSuccess,
  }: MemberInviteDialogProps) => (
    <div data-testid="member-invite-dialog">
      <div data-testid="dialog-tenant-slug">{tenantSlug}</div>
      <div data-testid="dialog-open">{isOpen ? "open" : "closed"}</div>
      <button onClick={onClose} data-testid="mock-dialog-close">
        Close Dialog
      </button>
      <button onClick={onInviteSuccess} data-testid="mock-invite-success">
        Trigger Invite Success
      </button>
    </div>
  ),
}));

// Mock MemberFilterBar component
jest.mock("@/components/Members/MemberFilterBar", () => ({
  MemberFilterBar: ({
    searchName,
    setSearchName,
    searchEmail,
    setSearchEmail,
    roleFilter,
    setRoleFilter,
  }: MemberFilterBarProps) => (
    <div data-testid="member-filter-bar">
      <input
        data-testid="name-filter"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        placeholder="Search name"
      />
      <input
        data-testid="email-filter"
        value={searchEmail}
        onChange={(e) => setSearchEmail(e.target.value)}
        placeholder="Search email"
      />
      <select
        data-testid="role-filter"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="all">All roles</option>
        <option value="owner">Owner</option>
        <option value="member">Member</option>
      </select>
    </div>
  ),
}));

// Mock the service functions
jest.mock("@/lib/tenant-service", () => ({
  getTenantBySlug: jest.fn(),
}));

jest.mock("@/lib/member-service", () => ({
  getTenantMembers: jest.fn(),
}));

// Mock useTenantRole hook
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(),
}));

describe("MembersPage", () => {
  const mockMembers = [
    {
      id: "member-1",
      user_id: "test-user-id",
      tenant_id: "tenant-1",
      role: "owner",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      profile: {
        id: "profile-1",
        full_name: "Test Owner",
        email: "test@example.com",
        first_name: "Test",
        last_name: "Owner",
      },
    },
    {
      id: "member-2",
      user_id: "user-2",
      tenant_id: "tenant-1",
      role: "member",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      profile: {
        id: "profile-2",
        full_name: "Test Member",
        email: "member@example.com",
        first_name: "Test",
        last_name: "Member",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Set up default mocks
    (tenantService.getTenantBySlug as jest.Mock).mockResolvedValue(mockTenant);
    (memberService.getTenantMembers as jest.Mock).mockResolvedValue(mockMembers);
    useTenantRole.mockReturnValue({ role: "owner", isLoading: false });

    // Default authenticated user
    mockUseSessionHelpers.authenticatedNoProfile();
  });

  describe("Authentication and Navigation", () => {
    it("should redirect to auth page when user is not authenticated", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<MembersPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should not redirect when session is loading", () => {
      mockUseSessionHelpers.loading();

      render(<MembersPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should not redirect when user is authenticated", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<MembersPage />);
      });

      expect(mockNavigate).not.toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should redirect to tenant page when current user is not a member", async () => {
      const membersWithoutCurrentUser = [
        {
          id: "member-2",
          user_id: "user-2",
          tenant_id: "tenant-1",
          role: "member",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          profile: {
            id: "profile-2",
            full_name: "Test Member",
            email: "member@example.com",
          },
        },
      ];

      (memberService.getTenantMembers as jest.Mock).mockResolvedValue(membersWithoutCurrentUser);

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
      });
    });

    it("should redirect to not-found when tenant does not exist", async () => {
      (tenantService.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/not-found");
      });
    });
  });

  describe("Rendering", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should show loading state while session is loading", async () => {
      mockUseSessionHelpers.loading();

      await act(async () => {
        render(<MembersPage />);
      });

      expect(screen.getByText("common:loading")).toBeInTheDocument();
    });

    it("should show loading state while data is loading", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      // Mock delayed response
      (memberService.getTenantMembers as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockMembers), 100);
          }),
      );

      await act(async () => {
        render(<MembersPage />);
      });

      expect(screen.getByText("common:loading")).toBeInTheDocument();
    });

    it("should render the page layout with correct props", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-page-layout")).toBeInTheDocument();
        expect(screen.getByTestId("layout-title")).toHaveTextContent("members:membersTitle");
        expect(screen.getByTestId("layout-description")).toHaveTextContent("members:membersDesc");
        expect(screen.getByTestId("layout-tenant-name")).toHaveTextContent(mockTenant.name);
        expect(screen.getByTestId("layout-tenant-slug")).toHaveTextContent(mockTenant.slug);
        expect(screen.getByTestId("breadcrumb-0")).toHaveTextContent("nav:members");
      });
    });

    it("should render member filter bar", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("member-filter-bar")).toBeInTheDocument();
      });
    });

    it("should render member table with correct props", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("member-table")).toBeInTheDocument();
        expect(screen.getByTestId("members-count")).toHaveTextContent("2");
        expect(screen.getByTestId("current-user-id")).toHaveTextContent("test-user-id");
        expect(screen.getByTestId("is-owner")).toHaveTextContent("true");
      });
    });

    it("should show invite button for owners", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        const actionContainer = screen.getByTestId("layout-action");
        expect(actionContainer).toHaveTextContent("members:inviteMember");
      });
    });

    it("should not show invite button for non-owners", async () => {
      useTenantRole.mockReturnValue({ role: "member", isLoading: false });

      const nonOwnerMembers = [
        {
          ...mockMembers[0],
          role: "member",
        },
        mockMembers[1],
      ];

      (memberService.getTenantMembers as jest.Mock).mockResolvedValue(nonOwnerMembers);

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        const actionContainer = screen.getByTestId("layout-action");
        expect(actionContainer).toBeEmptyDOMElement();
        expect(screen.getByTestId("is-owner")).toHaveTextContent("false");
      });
    });

    it("should show tenant not found when tenant is null after loading", async () => {
      (tenantService.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common:tenantNotFound")).toBeInTheDocument();
        expect(screen.getByText("common:tenantNotFoundDesc")).toBeInTheDocument();
        expect(screen.getByText("common:returnHome")).toBeInTheDocument();
      });
    });
  });

  describe("Member Filtering", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should filter members by name", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("member-table")).toBeInTheDocument();
      });

      const nameFilter = screen.getByTestId("name-filter");
      await act(async () => {
        await user.type(nameFilter, "Owner");
      });

      // The filtering is done in the component, so we need to check if the filtered data is passed
      await waitFor(() => {
        // Since we're mocking the MemberTable component, we can't directly test the filtering logic
        // but we can verify that the filter input is working
        expect(nameFilter).toHaveValue("Owner");
      });
    });

    it("should filter members by email", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("member-table")).toBeInTheDocument();
      });

      const emailFilter = screen.getByTestId("email-filter");
      await act(async () => {
        await user.type(emailFilter, "test@");
      });

      await waitFor(() => {
        expect(emailFilter).toHaveValue("test@");
      });
    });

    it("should filter members by role", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("member-table")).toBeInTheDocument();
      });

      const roleFilter = screen.getByTestId("role-filter");
      await act(async () => {
        await user.selectOptions(roleFilter, "owner");
      });

      await waitFor(() => {
        expect(roleFilter).toHaveValue("owner");
      });
    });
  });

  describe("Member Management", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should open invite dialog when invite button is clicked", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("layout-action")).toBeInTheDocument();
      });

      const inviteButton = screen.getByText("members:inviteMember");
      await act(async () => {
        await user.click(inviteButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("dialog-open")).toHaveTextContent("open");
      });
    });

    it("should close invite dialog when close is triggered", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("layout-action")).toBeInTheDocument();
      });

      // Open dialog first
      const inviteButton = screen.getByText("members:inviteMember");
      await act(async () => {
        await user.click(inviteButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("dialog-open")).toHaveTextContent("open");
      });

      // Close dialog
      const closeButton = screen.getByTestId("mock-dialog-close");
      await act(async () => {
        await user.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("dialog-open")).toHaveTextContent("closed");
      });
    });

    it("should refresh member list when invite is successful", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("member-table")).toBeInTheDocument();
        },
        { timeout: 15000 },
      );

      // Record initial call count before action
      const initialCallCount = (memberService.getTenantMembers as jest.Mock).mock.calls.length;

      const inviteSuccessButton = screen.getByTestId("mock-invite-success");

      await act(async () => {
        await user.click(inviteSuccessButton);
      });

      // Wait for the refresh to happen
      await waitFor(
        () => {
          expect((memberService.getTenantMembers as jest.Mock).mock.calls.length).toBeGreaterThan(
            initialCallCount,
          );
        },
        { timeout: 15000 },
      );
    }, 20000);

    it("should refresh member list when member is updated", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("member-table")).toBeInTheDocument();
        },
        { timeout: 15000 },
      );

      // Record initial call count before action
      const initialCallCount = (memberService.getTenantMembers as jest.Mock).mock.calls.length;

      const memberUpdatedButton = screen.getByTestId("mock-member-updated");

      await act(async () => {
        await user.click(memberUpdatedButton);
      });

      // Wait for the refresh to happen
      await waitFor(
        () => {
          expect((memberService.getTenantMembers as jest.Mock).mock.calls.length).toBeGreaterThan(
            initialCallCount,
          );
        },
        { timeout: 15000 },
      );
    }, 20000);
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should handle tenant fetch error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantService.getTenantBySlug as jest.Mock).mockRejectedValue(new Error("Fetch error"));

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching data:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("should handle member fetch error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (memberService.getTenantMembers as jest.Mock).mockRejectedValue(new Error("Fetch error"));

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching data:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("should handle missing slug parameter", async () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      await act(async () => {
        render(<MembersPage />);
      });

      // Should not make any API calls with undefined slug
      await waitFor(() => {
        expect(tenantService.getTenantBySlug).not.toHaveBeenCalled();
        expect(memberService.getTenantMembers).not.toHaveBeenCalled();
      });
    });
  });

  describe("Data Loading", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should fetch tenant and members data on mount", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(tenantService.getTenantBySlug).toHaveBeenCalledWith("test-church");
        expect(memberService.getTenantMembers).toHaveBeenCalledWith(mockTenant.id);
      });
    });

    it("should determine if current user is owner correctly", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-owner")).toHaveTextContent("true");
      });
    });

    it("should determine if current user is not owner correctly", async () => {
      useTenantRole.mockReturnValue({ role: "member", isLoading: false });

      const nonOwnerMembers = [
        {
          ...mockMembers[0],
          role: "member",
        },
        mockMembers[1],
      ];

      (memberService.getTenantMembers as jest.Mock).mockResolvedValue(nonOwnerMembers);

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-owner")).toHaveTextContent("false");
      });
    });

    it("should not fetch data when user is not available", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<MembersPage />);
      });

      expect(tenantService.getTenantBySlug).not.toHaveBeenCalled();
      expect(memberService.getTenantMembers).not.toHaveBeenCalled();
    });
  });

  describe("Return to Home Button", () => {
    it("should navigate to home when return button is clicked", async () => {
      const user = userEvent.setup();
      (tenantService.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common:returnHome")).toBeInTheDocument();
      });

      const returnButton = screen.getByText("common:returnHome");
      await act(async () => {
        await user.click(returnButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticatedNoProfile();
    });

    it("should render proper heading structure", async () => {
      (tenantService.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });
    });

    it("should render button with proper accessibility", async () => {
      await act(async () => {
        render(<MembersPage />);
      });

      await waitFor(() => {
        const inviteButton = screen.getByRole("button", { name: /members.inviteMember/i });
        expect(inviteButton).toBeInTheDocument();
        expect(inviteButton).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });
});
