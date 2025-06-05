import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import AuthPage from "@/pages/tenant/AuthPage";
import { useSession } from "@/hooks/useSession";
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

// Get the mocked useSession
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock AuthTabs component
jest.mock("@/components/Auth/AuthTabs", () => ({
  AuthTabs: ({
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
    <div data-testid="auth-tabs">
      <div data-testid="tenant-slug">{tenantSlug || "no-slug"}</div>
      <div data-testid="tenant-name">{tenantName || "no-name"}</div>
      <div data-testid="invite-token">{inviteToken || "no-token"}</div>
      <button onClick={onSuccess} data-testid="mock-auth-success">
        Mock Auth Success
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
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
    role: "authenticated",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockTenant = {
    id: "tenant-1",
    name: "Test Church",
    slug: "test-church",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    price_tier_id: "basic",
  };

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

  describe("Tenant Loading", () => {
    it("should show loading state while fetching tenant", async () => {
      // Mock pending promise
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should display tenant not found error when tenant doesn't exist", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Tenant Not Found")).toBeInTheDocument();
        expect(screen.getByText(/does not exist or has been deleted/)).toBeInTheDocument();
      });
    });

    it("should handle tenant fetching errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (tenantUtils.getTenantBySlug as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load tenant information/)).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching tenant:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("Invitation Token Handling", () => {
    it("should extract invite token from URL parameters", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?token=invite-123",
        },
        writable: true,
      });

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-123");
      });
    });

    it("should handle missing invite token", async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

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

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-456");
      });
    });
  });

  describe("User Authentication and Access", () => {
    it("should redirect authenticated users with access to tenant dashboard", async () => {
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(true);

      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
      });
    });

    it("should not redirect authenticated users without access and no invite token", async () => {
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(false);

      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("歡迎來到 Test Church")).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should show auth form for authenticated users without access but with invite token", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?token=invite-789",
        },
        writable: true,
      });

      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(false);

      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("歡迎來到 Test Church")).toBeInTheDocument();
        expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-789");
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle authentication check errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (memberService.checkUserTenantAccess as jest.Mock).mockRejectedValue(
        new Error("Access check failed"),
      );

      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("歡迎來到 Test Church")).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error checking tenant membership:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("Auth Form Display", () => {
    beforeEach(async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should display tenant name and auth form when tenant exists", async () => {
      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("歡迎來到 Test Church")).toBeInTheDocument();
        expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
        expect(screen.getByTestId("tenant-slug")).toHaveTextContent("test-church");
        expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
      });
    });

    it("should pass correct props to AuthTabs component", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?token=test-invite",
        },
        writable: true,
      });

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

  describe("Authentication Success Handler", () => {
    beforeEach(async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should navigate to tenant dashboard on successful authentication", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
      });

      const successButton = screen.getByTestId("mock-auth-success");
      await user.click(successButton);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
    });
  });

  describe("Error Page Display", () => {
    it("should show error page when tenant is not found", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Tenant Not Found")).toBeInTheDocument();
        expect(screen.getByText("Return to home")).toBeInTheDocument();
      });
    });

    it("should allow navigation back to home from error page", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      const user = userEvent.setup();

      await act(async () => {
        render(<AuthPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Return to home")).toBeInTheDocument();
      });

      const homeLink = screen.getByText("Return to home");
      await user.click(homeLink);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Loading States", () => {
    it("should show session loading state", async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should show tenant loading spinner", async () => {
      // Mock pending promise to simulate loading
      (tenantUtils.getTenantBySlug as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      // Should show loading with spinner
      expect(screen.getByText("common.loading")).toBeInTheDocument();
      // Check for spinner icon (Loader2 component)
      expect(
        document.querySelector('[data-testid="loader"]') || document.querySelector(".animate-spin"),
      ).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing slug parameter", async () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      // Should not call getTenantBySlug with undefined slug
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });

    it("should handle rapid state changes during loading", async () => {
      // Start with loading tenant
      let resolvePromise: (value: typeof mockTenant) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (tenantUtils.getTenantBySlug as jest.Mock).mockReturnValue(pendingPromise);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

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
        expect(screen.getByText("歡迎來到 Test Church")).toBeInTheDocument();
      });
    });

    it("should handle missing user during authentication check", async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        render(<AuthPage />);
      });

      // Should not attempt to check access without user
      expect(memberService.checkUserTenantAccess).not.toHaveBeenCalled();
    });

    it("should handle session loading to user state transition", async () => {
      // Start with loading session
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      let rerender: (ui: React.ReactElement) => void;
      await act(async () => {
        const result = render(<AuthPage />);
        rerender = result.rerender;
      });

      expect(screen.getByText("common.loading")).toBeInTheDocument();

      // Change to user with access
      (memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(true);
      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      await act(async () => {
        rerender(<AuthPage />);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church");
      });
    });
  });
});
