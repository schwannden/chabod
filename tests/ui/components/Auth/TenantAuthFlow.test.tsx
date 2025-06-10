import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import { TenantAuthFlow } from "@/components/Auth/TenantAuthFlow";

// Mock the hook
const mockUseTenantAuthFlow = {
  currentStep: "welcome" as const,
  detectedEmail: null,
  isLoading: false,
  error: null,
  setStep: jest.fn(),
  checkEmailExists: jest.fn(),
  reset: jest.fn(),
};

jest.mock("@/hooks/useTenantAuthFlow", () => ({
  useTenantAuthFlow: () => mockUseTenantAuthFlow,
}));

// Mock child components
jest.mock("@/components/Auth/TenantWelcomeScreen", () => ({
  TenantWelcomeScreen: ({
    tenantName,
    inviteToken,
    onNewUser,
    onExistingUser,
    onMemberSignIn,
  }: {
    tenantName: string;
    inviteToken?: string;
    onNewUser: () => void;
    onExistingUser: () => void;
    onMemberSignIn: () => void;
  }) => (
    <div data-testid="tenant-welcome-screen">
      <div data-testid="tenant-name">{tenantName}</div>
      <div data-testid="invite-token">{inviteToken || "no-token"}</div>
      <button onClick={onNewUser} data-testid="new-user-btn">
        New User
      </button>
      <button onClick={onExistingUser} data-testid="existing-user-btn">
        Existing User
      </button>
      <button onClick={onMemberSignIn} data-testid="member-signin-btn">
        Member Sign In
      </button>
    </div>
  ),
}));

jest.mock("@/components/Auth/EmailDetectionForm", () => ({
  EmailDetectionForm: ({
    tenantName,
    onBack,
    onEmailChecked,
    isLoading,
    error,
  }: {
    tenantName: string;
    onBack: () => void;
    onEmailChecked: (email: string) => void;
    isLoading: boolean;
    error: string | null;
  }) => (
    <div data-testid="email-detection-form">
      <div data-testid="tenant-name">{tenantName}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || "no-error"}</div>
      <button onClick={onBack} data-testid="back-btn">
        Back
      </button>
      <button onClick={() => onEmailChecked("test@example.com")} data-testid="check-email-btn">
        Check Email
      </button>
    </div>
  ),
}));

jest.mock("@/components/Auth/JoinTenantSignUpForm", () => ({
  JoinTenantSignUpForm: ({
    tenantName,
    tenantSlug,
    inviteToken,
    onBack,
    onSuccess,
    prefilledEmail,
  }: {
    tenantName: string;
    tenantSlug: string;
    inviteToken?: string;
    onBack: () => void;
    onSuccess: () => void;
    prefilledEmail?: string;
  }) => (
    <div data-testid="join-tenant-signup-form">
      <div data-testid="tenant-name">{tenantName}</div>
      <div data-testid="tenant-slug">{tenantSlug}</div>
      <div data-testid="invite-token">{inviteToken || "no-token"}</div>
      <div data-testid="prefilled-email">{prefilledEmail || "no-email"}</div>
      <button onClick={onBack} data-testid="back-btn">
        Back
      </button>
      <button onClick={onSuccess} data-testid="success-btn">
        Success
      </button>
    </div>
  ),
}));

jest.mock("@/components/Auth/JoinTenantSignInForm", () => ({
  JoinTenantSignInForm: ({
    tenantName,
    tenantSlug,
    inviteToken,
    onBack,
    onSuccess,
    prefilledEmail,
  }: {
    tenantName: string;
    tenantSlug: string;
    inviteToken?: string;
    onBack: () => void;
    onSuccess: () => void;
    prefilledEmail?: string;
  }) => (
    <div data-testid="join-tenant-signin-form">
      <div data-testid="tenant-name">{tenantName}</div>
      <div data-testid="tenant-slug">{tenantSlug}</div>
      <div data-testid="invite-token">{inviteToken || "no-token"}</div>
      <div data-testid="prefilled-email">{prefilledEmail || "no-email"}</div>
      <button onClick={onBack} data-testid="back-btn">
        Back
      </button>
      <button onClick={onSuccess} data-testid="success-btn">
        Success
      </button>
    </div>
  ),
}));

jest.mock("@/components/Auth/MemberSignInForm", () => ({
  MemberSignInForm: ({
    tenantName,
    onBack,
    onSuccess,
  }: {
    tenantName: string;
    onBack: () => void;
    onSuccess: () => void;
  }) => (
    <div data-testid="member-signin-form">
      <div data-testid="tenant-name">{tenantName}</div>
      <button onClick={onBack} data-testid="back-btn">
        Back
      </button>
      <button onClick={onSuccess} data-testid="success-btn">
        Success
      </button>
    </div>
  ),
}));

describe("TenantAuthFlow", () => {
  const defaultProps = {
    tenantSlug: "test-church",
    tenantName: "Test Church",
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTenantAuthFlow.currentStep = "welcome";
    mockUseTenantAuthFlow.detectedEmail = null;
    mockUseTenantAuthFlow.isLoading = false;
    mockUseTenantAuthFlow.error = null;
  });

  describe("Welcome Step", () => {
    it("should render welcome screen by default", () => {
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("tenant-welcome-screen")).toBeInTheDocument();
      expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
      expect(screen.getByTestId("invite-token")).toHaveTextContent("no-token");
    });

    it("should render welcome screen with invite token", () => {
      render(<TenantAuthFlow {...defaultProps} inviteToken="invite-123" />);

      expect(screen.getByTestId("tenant-welcome-screen")).toBeInTheDocument();
      expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-123");
    });

    it("should handle new user button click", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const newUserBtn = screen.getByTestId("new-user-btn");
      await user.click(newUserBtn);

      expect(mockUseTenantAuthFlow.setStep).toHaveBeenCalledWith("signup");
    });

    it("should handle existing user button click", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const existingUserBtn = screen.getByTestId("existing-user-btn");
      await user.click(existingUserBtn);

      expect(mockUseTenantAuthFlow.setStep).toHaveBeenCalledWith("email-detection");
    });

    it("should handle member sign in button click", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const memberSignInBtn = screen.getByTestId("member-signin-btn");
      await user.click(memberSignInBtn);

      expect(mockUseTenantAuthFlow.setStep).toHaveBeenCalledWith("signin");
    });
  });

  describe("Email Detection Step", () => {
    beforeEach(() => {
      mockUseTenantAuthFlow.currentStep = "email-detection";
    });

    it("should render email detection form", () => {
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("email-detection-form")).toBeInTheDocument();
      expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
    });

    it("should handle back button", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const backBtn = screen.getByTestId("back-btn");
      await user.click(backBtn);

      expect(mockUseTenantAuthFlow.reset).toHaveBeenCalled();
    });

    it("should handle email check when email exists", async () => {
      mockUseTenantAuthFlow.checkEmailExists.mockResolvedValue(true);
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const checkEmailBtn = screen.getByTestId("check-email-btn");
      await user.click(checkEmailBtn);

      await waitFor(() => {
        expect(mockUseTenantAuthFlow.checkEmailExists).toHaveBeenCalledWith("test@example.com");
        expect(mockUseTenantAuthFlow.setStep).toHaveBeenCalledWith("join-signin");
      });
    });

    it("should handle email check when email doesn't exist", async () => {
      mockUseTenantAuthFlow.checkEmailExists.mockResolvedValue(false);
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const checkEmailBtn = screen.getByTestId("check-email-btn");
      await user.click(checkEmailBtn);

      await waitFor(() => {
        expect(mockUseTenantAuthFlow.checkEmailExists).toHaveBeenCalledWith("test@example.com");
        expect(mockUseTenantAuthFlow.setStep).toHaveBeenCalledWith("signup");
      });
    });

    it("should display loading state", () => {
      mockUseTenantAuthFlow.isLoading = true;
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("loading")).toHaveTextContent("true");
    });

    it("should display error state", () => {
      mockUseTenantAuthFlow.error = "Email check failed";
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("error")).toHaveTextContent("Email check failed");
    });
  });

  describe("Signup Step", () => {
    beforeEach(() => {
      mockUseTenantAuthFlow.currentStep = "signup";
    });

    it("should render signup form", () => {
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("join-tenant-signup-form")).toBeInTheDocument();
      expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
      expect(screen.getByTestId("tenant-slug")).toHaveTextContent("test-church");
    });

    it("should pass invite token to signup form", () => {
      render(<TenantAuthFlow {...defaultProps} inviteToken="invite-123" />);

      expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-123");
    });

    it("should pass detected email to signup form", () => {
      mockUseTenantAuthFlow.detectedEmail = "detected@example.com";
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("prefilled-email")).toHaveTextContent("detected@example.com");
    });

    it("should handle back button", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const backBtn = screen.getByTestId("back-btn");
      await user.click(backBtn);

      expect(mockUseTenantAuthFlow.reset).toHaveBeenCalled();
    });

    it("should handle success", async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      render(<TenantAuthFlow {...defaultProps} onSuccess={onSuccess} />);

      const successBtn = screen.getByTestId("success-btn");
      await user.click(successBtn);

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("Join Sign-in Step", () => {
    beforeEach(() => {
      mockUseTenantAuthFlow.currentStep = "join-signin";
    });

    it("should render join signin form", () => {
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("join-tenant-signin-form")).toBeInTheDocument();
      expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
      expect(screen.getByTestId("tenant-slug")).toHaveTextContent("test-church");
    });

    it("should pass invite token to signin form", () => {
      render(<TenantAuthFlow {...defaultProps} inviteToken="invite-123" />);

      expect(screen.getByTestId("invite-token")).toHaveTextContent("invite-123");
    });

    it("should pass detected email to signin form", () => {
      mockUseTenantAuthFlow.detectedEmail = "detected@example.com";
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("prefilled-email")).toHaveTextContent("detected@example.com");
    });

    it("should handle back button", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const backBtn = screen.getByTestId("back-btn");
      await user.click(backBtn);

      expect(mockUseTenantAuthFlow.reset).toHaveBeenCalled();
    });

    it("should handle success", async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      render(<TenantAuthFlow {...defaultProps} onSuccess={onSuccess} />);

      const successBtn = screen.getByTestId("success-btn");
      await user.click(successBtn);

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("Member Sign-in Step", () => {
    beforeEach(() => {
      mockUseTenantAuthFlow.currentStep = "signin";
    });

    it("should render member signin form", () => {
      render(<TenantAuthFlow {...defaultProps} />);

      expect(screen.getByTestId("member-signin-form")).toBeInTheDocument();
      expect(screen.getByTestId("tenant-name")).toHaveTextContent("Test Church");
    });

    it("should handle back button", async () => {
      const user = userEvent.setup();
      render(<TenantAuthFlow {...defaultProps} />);

      const backBtn = screen.getByTestId("back-btn");
      await user.click(backBtn);

      expect(mockUseTenantAuthFlow.reset).toHaveBeenCalled();
    });

    it("should handle success", async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      render(<TenantAuthFlow {...defaultProps} onSuccess={onSuccess} />);

      const successBtn = screen.getByTestId("success-btn");
      await user.click(successBtn);

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("Invalid Step", () => {
    it("should render nothing for invalid step", () => {
      mockUseTenantAuthFlow.currentStep = "invalid-step" as AuthFlowStep;
      const { container } = render(<TenantAuthFlow {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });
  });
});
