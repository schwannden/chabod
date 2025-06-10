import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockTenant } from "../../test-utils";
import AuthPage from "@/pages/tenant/AuthPage";
import * as tenantUtils from "@/lib/tenant-utils";
import * as memberService from "@/lib/member-service";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ slug: "test-church" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock TenantAuthFlow component
jest.mock("@/components/Auth/TenantAuthFlow", () => ({
  TenantAuthFlow: ({
    onSuccess,
    tenantSlug,
    tenantName,
    inviteToken,
  }: {
    onSuccess: () => void;
    tenantSlug?: string;
    tenantName?: string;
    inviteToken?: string;
  }) => (
    <div data-testid="tenant-auth-flow">
      <div data-testid="tenant-slug">{tenantSlug || "no-slug"}</div>
      <div data-testid="tenant-name">{tenantName || "no-name"}</div>
      <div data-testid="invite-token">{inviteToken || "no-token"}</div>
      <button onClick={onSuccess} data-testid="auth-success">
        Auth Success
      </button>
    </div>
  ),
}));

// Mock the service functions
jest.mock("@/lib/tenant-utils", () => ({
  getTenantBySlug: jest.fn(),
  getTenants: jest.fn(),
}));

jest.mock("@/lib/member-service", () => ({
  checkUserTenantAccess: jest.fn(),
}));

describe("AuthPage (Tenant)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Set up default mocks
    (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(mockTenant);
    (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(false);

    // Mock window.location.search
    Object.defineProperty(window, "location", {
      value: {
        search: "",
      },
      writable: true,
    });
  });

  describe("Page Loading States", () => {
    it("should show session loading state", async () => {
      mockUseSessionHelpers.loading();

      await act(async () => {
        render(<AuthPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should show tenant loading state while fetching tenant", async () => {
      // Mock pending promise
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
      // Check for spinner icon (Loader2 component)
      expect(
        document.querySelector('[data-testid="loader"]') || document.querySelector(".animate-spin"),
      ).toBeTruthy();
    });
  });

  describe("Tenant Management", () => {
    it("should fetch tenant based on URL slug parameter", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      expect(tenantUtils.getTenantBySlug).toHaveBeenCalledWith("test-church");
    });

    it("should display tenant not found error when tenant doesn't exist", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common.tenantNotFound")).toBeInTheDocument();
        expect(screen.getByText("common.tenantNotFoundDesc")).toBeInTheDocument();
      });
    });

    it("should handle tenant fetching errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantUtils.getTenantBySlug as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common.unknownError")).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching tenant:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should handle missing slug parameter", async () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      // Should not call getTenantBySlug with undefined slug
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });
  });

  describe("URL Parameter Handling", () => {
    it("should extract invite token from URL parameters", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?token=invite-123",
        },
        writable: true,
      });

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-123");
      });
    });

    it("should handle missing invite token", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("invite-token")).toHaveTextContent("no-token");
      });
    });

    it("should handle multiple URL parameters including token", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?redirect=dashboard&token=invite-456&other=param",
        },
        writable: true,
      });

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-456");
      });
    });
  });

  describe("User Authentication and Navigation", () => {
    it("should redirect authenticated users with access to tenant dashboard", async () => {
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(true);

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
      });
    });

    it("should not redirect authenticated users without access", async () => {
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(false);

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle error when checking access fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (memberService.checkUserTenantAccess as jest.Mock).mockRejectedValue(
        new Error("Access check failed"),
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error checking tenant membership:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it("should navigate to tenant dashboard after successful authentication", async () => {
      const user = userEvent.setup();

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-auth-flow")).toBeInTheDocument();
      });

      const successButton = screen.getByTestId("auth-success");
      await user.click(successButton);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
    });
  });

  describe("Page Layout and Content", () => {
    it("should display tenant name and welcome message when tenant exists", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
        expect(screen.getByTestId("tenant-auth-flow")).toBeInTheDocument();
      });
    });

    it("should pass correct props to TenantAuthFlow component", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?token=test-invite",
        },
        writable: true,
      });

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-slug")).toHaveTextContent("test-church");
        expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
        expect(screen.getByTestId("invite-token")).toHaveTextContent("test-invite");
      });
    });
  });

  describe("Error Page Display", () => {
    it("should show error page when tenant is not found", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common.tenantNotFound")).toBeInTheDocument();
        expect(screen.getByText("common.returnHome")).toBeInTheDocument();
      });
    });

    it("should allow navigation back to home from error page", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSessionHelpers.unauthenticated();

      const user = userEvent.setup();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("common.returnHome")).toBeInTheDocument();
      });

      const homeLink = screen.getByText("common.returnHome");
      await user.click(homeLink);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Edge Cases and State Transitions", () => {
    it("should handle rapid state changes during loading", async () => {
      // Start with loading tenant
      let resolvePromise: (value: typeof mockTenant) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (tenantUtils.getTenantBySlug as jest.Mock).mockReturnValue(pendingPromise);

      mockUseSessionHelpers.unauthenticated();

      let rerender: (ui: React.ReactElement) => void;
      await act(async () => {
        const result = render(<AuthPage />);
        rerender = result.rerender;
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();

      // Resolve the promise to simulate data loading
      await act(async () => {
        resolvePromise!(mockTenant);
        rerender(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
      });
    });

    it("should handle session loading to user state transition", async () => {
      // Start with loading session
      mockUseSessionHelpers.loading();

      let rerender: (ui: React.ReactElement) => void;
      await act(async () => {
        const result = render(<AuthPage />);
        rerender = result.rerender;
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();

      // Change to user with access
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(true);
      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        rerender(<AuthPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
      });
    });

    it("should not check access if user is null", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<AuthPage />);
      });

      // Should not attempt to check access without user
      expect(memberService.checkUserTenantAccess).not.toHaveBeenCalled();
    });

    it("should handle cases where user authenticates but has no tenant access", async () => {
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(false);

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<AuthPage />);
      });

      // Should check access when user is present
      await waitFor(() => {
        expect(memberService.checkUserTenantAccess).toHaveBeenCalledWith(
          "test-user-id",
          "test-church",
        );
      });

      // Should show auth form since user doesn't have access
      expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
    });
  });
});
