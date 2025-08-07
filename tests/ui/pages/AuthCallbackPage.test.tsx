import { screen, waitFor, act } from "@testing-library/react";
import { render, mockUseSessionHelpers } from "../test-utils";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

// Mock navigation and URL parameters
const mockNavigate = jest.fn();
let mockSearchParams = new URLSearchParams();
const mockUseSearchParams = jest.fn(() => [mockSearchParams]);

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
}));

// Mock session storage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("AuthCallbackPage", () => {
  const setupUrlParams = (params: Record<string, string>) => {
    mockSearchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      mockSearchParams.set(key, value);
    });
    mockUseSearchParams.mockReturnValue([mockSearchParams]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockSearchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue([mockSearchParams]);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe("OAuth Success Flow", () => {
    it("should show loading state while processing OAuth callback", () => {
      // When sessionLoading is true, should show loading regardless of other states
      mockUseSessionHelpers.loading();
      setupUrlParams({});

      render(<AuthCallbackPage />);

      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();
      expect(screen.getByText("common:processing")).toBeInTheDocument();
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should redirect to dashboard after successful authentication", async () => {
      mockUseSessionHelpers.authenticated();
      setupUrlParams({});

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });

    it("should redirect to stored redirect path after successful authentication", async () => {
      mockUseSessionHelpers.authenticated();
      mockSessionStorage.getItem.mockReturnValue("/custom/path");
      setupUrlParams({});

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/custom/path", { replace: true });
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("redirectPath");
      });
    });

    it("should handle tenant invitation flow with invite token", async () => {
      mockUseSessionHelpers.authenticated();
      setupUrlParams({ inviteToken: "test-invite-token" });

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/auth?invite=test-invite-token", {
          replace: true,
        });
      });
    });

    it("should wait for session to be established before redirecting", async () => {
      // Start with loading state
      mockUseSessionHelpers.loading();
      setupUrlParams({});

      const { rerender } = render(<AuthCallbackPage />);

      // Should not redirect while loading
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();

      // Session becomes available
      mockUseSessionHelpers.authenticated();
      rerender(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });
  });

  describe("OAuth Error Handling", () => {
    // No need for beforeEach since we set session state per test

    it("should show error when OAuth has error parameter", async () => {
      // Start with sessionLoading false so handleOAuthCallback gets called
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({ error: "access_denied" });

      render(<AuthCallbackPage />);

      // Error should be shown immediately when error parameter is present
      expect(screen.getByText("auth:authenticationFailed")).toBeInTheDocument(); // h2 tag
      expect(screen.getByText("access_denied")).toBeInTheDocument();
      expect(screen.getByText("auth:tryAgain")).toBeInTheDocument();
    });

    it("should show error description when available", async () => {
      // Start with sessionLoading false so handleOAuthCallback gets called
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({
        error: "access_denied",
        error_description: "User denied the request",
      });

      render(<AuthCallbackPage />);

      // Error should be shown immediately when error parameter is present
      expect(screen.getByText("auth:authenticationFailed")).toBeInTheDocument(); // h2 tag
      expect(screen.getByText("User denied the request")).toBeInTheDocument();
    });

    it("should show error when no session after timeout", async () => {
      // Mock setTimeout to trigger immediately for testing
      jest.useFakeTimers();
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({});

      render(<AuthCallbackPage />);

      // Should initially show loading
      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();

      // Fast forward past the timeout and use act to handle state updates
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getAllByText("auth:authenticationFailed")).toHaveLength(2); // h2 and p tags (both show same text)
      });

      jest.useRealTimers();
    });

    it("should allow retry navigation to auth page", async () => {
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({ error: "access_denied" });

      render(<AuthCallbackPage />);

      // Error should be shown immediately when error parameter is present
      const retryButton = screen.getByText("auth:tryAgain");
      expect(retryButton).toBeInTheDocument();

      retryButton.click();
      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  describe("URL Parameter Processing", () => {
    beforeEach(() => {
      mockUseSessionHelpers.authenticated();
    });

    it("should preserve invite token through OAuth flow", async () => {
      setupUrlParams({ inviteToken: "special-invite-123" });

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/auth?invite=special-invite-123", {
          replace: true,
        });
      });
    });

    it("should handle empty parameters gracefully", async () => {
      setupUrlParams({});

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });

    it("should handle multiple URL parameters correctly", async () => {
      setupUrlParams({
        inviteToken: "test-token",
        other: "ignored-param",
      });

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tenant/auth?invite=test-token", {
          replace: true,
        });
      });
    });
  });

  describe("Layout and Accessibility", () => {
    it("should render proper loading state layout", () => {
      mockUseSessionHelpers.loading();
      setupUrlParams({});

      render(<AuthCallbackPage />);

      // Check layout structure
      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveClass("flex-1", "flex", "items-center", "justify-center");
      expect(document.querySelector("nav") || document.querySelector("header")).toBeTruthy();

      // Check loading content
      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();
      expect(screen.getByText("common:processing")).toBeInTheDocument();
    });

    it("should render proper error state layout", async () => {
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({ error: "access_denied" });

      render(<AuthCallbackPage />);

      // Error should be shown immediately when error parameter is present
      // Check error layout structure
      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveClass("flex-1", "flex", "items-center", "justify-center");

      // Check error content
      expect(screen.getByText("auth:authenticationFailed")).toBeInTheDocument(); // h2 tag
      expect(screen.getByRole("button", { name: "auth:tryAgain" })).toBeInTheDocument();
    });

    it("should have accessible error icon", async () => {
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({ error: "access_denied" });

      render(<AuthCallbackPage />);

      // Error should be shown immediately when error parameter is present
      const errorIcon = document.querySelector('svg[viewBox="0 0 24 24"]');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe("Session State Transitions", () => {
    it("should handle session state changes properly", async () => {
      // Start with no session
      mockUseSessionHelpers.unauthenticated();
      setupUrlParams({});

      const { rerender } = render(<AuthCallbackPage />);

      // Should show loading initially
      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();

      // Session becomes available
      mockUseSessionHelpers.authenticated();
      rerender(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });

    it("should handle loading state transitions correctly", () => {
      // Start with session loading
      mockUseSessionHelpers.loading();
      setupUrlParams({});

      const { rerender } = render(<AuthCallbackPage />);

      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();

      // Session loading finishes but no user - should start timeout
      mockUseSessionHelpers.unauthenticated();
      rerender(<AuthCallbackPage />);

      // Still shows loading while waiting for potential session
      expect(screen.getByText("auth:completingAuthentication")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should not crash with malformed URL parameters", async () => {
      // Setup malformed params by manipulating the mock directly
      const malformedParams = new URLSearchParams();
      malformedParams.append("error", "");
      malformedParams.append("inviteToken", "");
      mockUseSearchParams.mockReturnValue([malformedParams]);

      mockUseSessionHelpers.authenticated();

      expect(() => render(<AuthCallbackPage />)).not.toThrow();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });

    it("should handle concurrent session updates", async () => {
      mockUseSessionHelpers.loading();
      setupUrlParams({});

      const { rerender } = render(<AuthCallbackPage />);

      // Rapidly change states
      mockUseSessionHelpers.authenticated();
      rerender(<AuthCallbackPage />);

      mockUseSessionHelpers.unauthenticated();
      rerender(<AuthCallbackPage />);

      mockUseSessionHelpers.authenticated();
      rerender(<AuthCallbackPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });
  });
});
