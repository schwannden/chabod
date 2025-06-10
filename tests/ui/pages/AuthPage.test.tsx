import { screen } from "@testing-library/react";
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
  const setupUrlParams = (params: string) => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(params)]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    setupUrlParams("");
  });

  describe("Authentication State Management", () => {
    it("should show loading state and redirect when authenticated", () => {
      // Test loading state
      mockUseSessionHelpers.loading();
      const { rerender } = render(<AuthPage />);
      expect(screen.getByText("common.loading")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();

      // Test redirect on authentication
      mockUseSessionHelpers.authenticated();
      rerender(<AuthPage />);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should display auth form when not authenticated", () => {
      mockUseSessionHelpers.unauthenticated();
      render(<AuthPage />);

      expect(screen.getByText("auth.welcome")).toBeInTheDocument();
      expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  describe("URL Parameter Handling and Tab Selection", () => {
    beforeEach(() => {
      mockUseSessionHelpers.unauthenticated();
    });

    const urlParamTestCases = [
      { urlParams: "", expectedTab: "signin", description: "default case" },
      { urlParams: "tab=signin", expectedTab: "signin", description: "explicit signin" },
      { urlParams: "tab=signup", expectedTab: "signup", description: "explicit signup" },
      {
        urlParams: "tab=invalid",
        expectedTab: "signin",
        description: "invalid defaults to signin",
      },
      { urlParams: "tab=SIGNUP", expectedTab: "signin", description: "case sensitive" },
      {
        urlParams: "tab=signup&redirect=/dashboard",
        expectedTab: "signup",
        description: "multiple params",
      },
    ];

    urlParamTestCases.forEach(({ urlParams, expectedTab, description }) => {
      it(`should handle URL parameters: ${description}`, () => {
        setupUrlParams(urlParams);
        render(<AuthPage />);
        expect(screen.getByTestId("initial-tab")).toHaveTextContent(expectedTab);
      });
    });

    it("should update tab when URL parameters change", () => {
      setupUrlParams("tab=signin");
      const { rerender } = render(<AuthPage />);
      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signin");

      setupUrlParams("tab=signup");
      rerender(<AuthPage />);
      expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");
    });
  });

  describe("Authentication Success", () => {
    it("should navigate to dashboard after successful authentication", async () => {
      mockUseSessionHelpers.unauthenticated();
      const user = userEvent.setup();

      render(<AuthPage />);

      const successButton = screen.getByTestId("mock-auth-success");
      await user.click(successButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Layout and Error Handling", () => {
    it("should render proper page structure and handle state transitions", async () => {
      mockUseSessionHelpers.unauthenticated();
      render(<AuthPage />);

      // Check layout structure
      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveClass("container", "mx-auto");
      expect(document.querySelector("nav") || document.querySelector("header")).toBeTruthy();

      // Should not throw on session data
      expect(() => {
        mockUseSessionHelpers.authenticated();
      }).not.toThrow();
    });
  });
});
