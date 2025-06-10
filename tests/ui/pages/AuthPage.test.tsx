import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test-utils";
import AuthPage from "@/pages/AuthPage";
import { useSession } from "@/hooks/useSession";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn(() => [new URLSearchParams()]);
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
}));

// Get the mocked useSession
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock AuthTabs component
jest.mock("@/components/Auth/AuthTabs", () => ({
  AuthTabs: ({ onSuccess, initialTab }: { onSuccess: () => void; initialTab: string }) => (
    <div data-testid="auth-tabs">
      <div data-testid="initial-tab">{initialTab}</div>
      <button onClick={onSuccess} data-testid="mock-auth-success">
        Mock Auth Success
      </button>
    </div>
  ),
}));

describe("AuthPage (Main)", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  describe("Authentication State Management", () => {
    it("should show loading state when session is loading", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should redirect to dashboard when user is already logged in", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should not redirect during loading state", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Auth Form Display", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should display welcome title and auth form when not authenticated", () => {
      render(<AuthPage />);

      expect(screen.getByText("auth.welcome")).toBeInTheDocument();
      expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
    });

    it("should default to signin tab when no tab parameter is provided", () => {
      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });

    it("should use signup tab when tab parameter is set to signup", () => {
      // Mock useSearchParams to return signup tab
      mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=signup")]);

      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");
    });

    it("should default to signin for invalid tab parameters", () => {
      // Mock useSearchParams to return invalid tab
      mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=invalid")]);

      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });
  });

  describe("Authentication Success Handler", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should navigate to dashboard on successful authentication", async () => {
      const user = userEvent.setup();

      render(<AuthPage />);

      const successButton = screen.getByTestId("mock-auth-success");
      await user.click(successButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Layout and UI Elements", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should render navbar component", () => {
      render(<AuthPage />);

      // NavBar is rendered (we can check for its container or typical elements)
      expect(document.querySelector("nav") || document.querySelector("header")).toBeTruthy();
    });

    it("should render main content area with proper structure", () => {
      render(<AuthPage />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByText("auth.welcome")).toBeInTheDocument();
      expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
    });

    it("should apply proper styling classes", () => {
      render(<AuthPage />);

      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveClass("container");
      expect(mainElement).toHaveClass("mx-auto");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle rapid auth state changes", async () => {
      // Start with loading state
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      const { rerender } = render(<AuthPage />);

      // Verify loading state
      expect(screen.getByText("common.loading")).toBeInTheDocument();

      // Change to authenticated state
      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      rerender(<AuthPage />);

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should handle missing user with completed loading", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      // Should show auth form, not redirect
      expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle session data without throwing errors", () => {
      mockUseSession.mockReturnValue({
        session: {
          access_token: "fake-token",
          refresh_token: "fake-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: mockUser,
        },
        user: mockUser,
        profile: {
          id: "test-profile",
          full_name: "Test User",
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          avatar_url: "",
          updated_at: "2024-01-01T00:00:00Z",
        },
        isLoading: false,
        signOut: jest.fn(),
      });

      expect(() => render(<AuthPage />)).not.toThrow();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("URL Parameter Handling", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should properly handle empty search params", () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("")]);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });

    it("should handle multiple URL parameters", () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams("tab=signup&redirect=dashboard&other=param"),
      ]);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");
    });

    it("should handle case sensitivity in tab parameter", () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=SIGNUP")]);

      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<AuthPage />);

      // Should default to signin for case-sensitive mismatch
      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });

    it("should update tab when URL parameters change (simulating navbar navigation)", () => {
      // Start with signin (no tab parameter)
      mockUseSearchParams.mockReturnValue([new URLSearchParams("")]);

      const { rerender } = render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");

      // Simulate clicking navbar signup link (changing URL to include tab=signup)
      mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=signup")]);

      rerender(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");

      // Simulate clicking navbar login link (changing URL to remove tab parameter)
      mockUseSearchParams.mockReturnValue([new URLSearchParams("")]);

      rerender(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });
  });
});
