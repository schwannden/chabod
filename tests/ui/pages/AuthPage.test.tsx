import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../test-utils";
import AuthPage from "@/pages/AuthPage";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn(() => [new URLSearchParams()]);
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  describe("Authentication State Management", () => {
    it("should show loading state when session is loading", () => {
      mockUseSessionHelpers.loading();

      render(<AuthPage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should redirect to dashboard when user is already logged in", () => {
      mockUseSessionHelpers.authenticated();

      render(<AuthPage />);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should not redirect during loading state", () => {
      mockUseSessionHelpers.loading();

      render(<AuthPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Auth Form Display", () => {
    beforeEach(() => {
      mockUseSessionHelpers.unauthenticated();
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
      mockUseSessionHelpers.unauthenticated();
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
      mockUseSessionHelpers.unauthenticated();
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
      mockUseSessionHelpers.loading();

      const { rerender } = render(<AuthPage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();

      // Switch to authenticated state
      mockUseSessionHelpers.authenticated();

      rerender(<AuthPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should handle missing user with completed loading", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<AuthPage />);

      expect(screen.getByText("auth.welcome")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle session data without throwing errors", () => {
      mockUseSessionHelpers.authenticated();

      expect(() => render(<AuthPage />)).not.toThrow();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("URL Parameter Handling", () => {
    beforeEach(() => {
      mockUseSessionHelpers.unauthenticated();
    });

    it("should properly handle empty search params", () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });

    it("should handle multiple URL parameters", () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=signup&redirect=/dashboard")]);

      render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");
    });

    it("should handle case sensitivity in tab parameter", () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=SIGNUP")]);

      render(<AuthPage />);

      // Should default to signin for invalid case
      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");
    });

    it("should update tab when URL parameters change (simulating navbar navigation)", async () => {
      const searchParams = new URLSearchParams("tab=signin");
      mockUseSearchParams.mockReturnValue([searchParams]);

      const { rerender } = render(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");

      // Simulate URL change to signup
      searchParams.set("tab", "signup");
      mockUseSearchParams.mockReturnValue([searchParams]);

      rerender(<AuthPage />);

      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");
    });
  });
});
