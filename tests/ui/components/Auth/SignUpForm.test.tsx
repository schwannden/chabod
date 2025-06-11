import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import { SignUpForm } from "@/components/Auth/SignUpForm";

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock tenant utilities
jest.mock("@/lib/tenant-utils", () => ({
  associateUserWithTenant: jest.fn(),
}));

// Import the mocked modules
import { supabase } from "@/integrations/supabase/client";
import { associateUserWithTenant } from "@/lib/tenant-utils";
import type { AuthError } from "@supabase/supabase-js";

// Get the mock functions
const mockSignUp = supabase.auth.signUp as jest.MockedFunction<typeof supabase.auth.signUp>;
const mockSignOut = supabase.auth.signOut as jest.MockedFunction<typeof supabase.auth.signOut>;
const mockAssociateUserWithTenant = associateUserWithTenant as jest.MockedFunction<
  typeof associateUserWithTenant
>;

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "auth:signUpTitle": "Create Account",
        "auth:signUpToJoin": "Sign up to join {{tenantName}}",
        "auth:signUpToChabod": "Sign up to Chabod",
        "auth:fullName": "Full Name",
        "auth:enterYourName": "Enter your name",
        "auth:creatingAccount": "Creating account...",
        "auth:createAccount": "Create Account",
        "auth:alreadyHaveAccount": "Already have an account?",
        "auth:pleaseAgreeToFaith": "Please agree to the statement of faith",
        "auth:mustAgreeToRegister": "You must agree to register",
        "auth:nameCannotBeEmpty": "Name cannot be empty",
        "auth:pleaseEnterYourName": "Please enter your name",
        "auth:emailAlreadyRegistered": "Email already registered",
        "auth:signInToJoin": "Sign in to join",
        "auth:accountCreatedSuccess": "Account created successfully",
        "auth:accountCreatedAndJoined": "Account created and joined {{tenantSlug}}",
        "auth:checkEmailForConfirmation": "Check your email for confirmation",
        "auth:createAccountFailed": "Create account failed",
        "auth:unknownError": "Unknown error",
        "auth:emailFormatIncorrect": "Email format incorrect",
        "auth:passwordMinLength": "Password minimum length required",
        "auth:cannotJoinChurch": "Cannot join church: {{errorMessage}}",
      };

      if (options && typeof options === "object") {
        let result = translations[key] || key;
        Object.keys(options).forEach((param) => {
          result = result.replace(`{{${param}}}`, String(options[param]));
        });
        return result;
      }
      return translations[key] || key;
    },
  }),
}));

// Mock UI components that we don't need to test in detail
jest.mock("@/components/Auth/AuthEmailInput", () => ({
  AuthEmailInput: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
  }) => (
    <input
      data-testid="email-input"
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

jest.mock("@/components/Auth/AuthPasswordInput", () => ({
  AuthPasswordInput: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
  }) => (
    <input
      data-testid="password-input"
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

jest.mock("@/components/Auth/TermsOfService", () => ({
  TermsOfService: ({
    accepted,
    onChange,
  }: {
    accepted: boolean;
    onChange: (accepted: boolean) => void;
  }) => (
    <div>
      <label>
        <input
          data-testid="terms-checkbox"
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
        />
        Terms of Service
      </label>
    </div>
  ),
}));

// Mock toast
const mockToast = jest.fn();
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("SignUpForm", () => {
  const defaultProps = {
    onSignInClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: "2024-01-01T00:00:00Z",
          email: "test@example.com",
          role: "authenticated",
          updated_at: "2024-01-01T00:00:00Z",
        },
        session: null,
      },
      error: null,
    });
    mockAssociateUserWithTenant.mockResolvedValue(undefined);
  });

  describe("Basic Rendering", () => {
    it("should render the sign up form with all fields", () => {
      render(<SignUpForm {...defaultProps} />);

      expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
      expect(screen.getByText("Sign up to Chabod")).toBeInTheDocument();
      expect(screen.getByText("Full Name")).toBeInTheDocument();
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("terms-checkbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Already have an account?" })).toBeInTheDocument();
    });

    it("should render with tenant information when provided", () => {
      render(<SignUpForm {...defaultProps} tenantName="Test Church" tenantSlug="test-church" />);

      expect(screen.getByText("Sign up to join Test Church")).toBeInTheDocument();
    });

    it("should render without tenant information", () => {
      render(<SignUpForm {...defaultProps} />);

      expect(screen.getByText("Sign up to Chabod")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should require terms of service acceptance", async () => {
      const user = userEvent.setup();
      render(<SignUpForm {...defaultProps} />);

      // Fill in form fields but don't accept terms
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Please agree to the statement of faith",
          description: "You must agree to register",
          variant: "destructive",
        });
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should trim whitespace from full name", async () => {
      const user = userEvent.setup();
      render(<SignUpForm {...defaultProps} />);

      // Fill in form with whitespace around name
      await user.type(screen.getByPlaceholderText("Enter your name"), "  John Doe  ");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: "john@example.com",
          password: "password123",
          options: {
            data: {
              full_name: "John Doe", // Should be trimmed
            },
          },
        });
      });
    });
  });

  describe("Successful Sign Up", () => {
    it("should create account successfully without tenant", async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      render(<SignUpForm {...defaultProps} onSuccess={mockOnSuccess} />);

      // Fill in form
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: "john@example.com",
          password: "password123",
          options: {
            data: {
              full_name: "John Doe",
            },
          },
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Account created successfully",
          description: "Check your email for confirmation",
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockAssociateUserWithTenant).not.toHaveBeenCalled();
    });

    it("should create account and associate with tenant", async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      render(
        <SignUpForm
          {...defaultProps}
          tenantSlug="test-church"
          inviteToken="invite-123"
          onSuccess={mockOnSuccess}
        />,
      );

      // Fill in form
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockAssociateUserWithTenant).toHaveBeenCalledWith(
          "test-user-id",
          "test-church",
          "invite-123",
        );
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Account created successfully",
          description: "Account created and joined test-church",
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe("Existing User Handling", () => {
    it("should show error message when user already exists", async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" } as AuthError,
      });

      render(<SignUpForm {...defaultProps} />);

      // Fill in form
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "existing@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByText("Email already registered")).toBeInTheDocument();
      });

      // Should show sign-in link
      expect(screen.getByRole("button", { name: "Sign in to join" })).toBeInTheDocument();

      // Should not show toast error
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });

    it("should call onSignInClick when sign-in link is clicked", async () => {
      const user = userEvent.setup();
      const mockOnSignInClick = jest.fn();
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" } as AuthError,
      });

      render(<SignUpForm {...defaultProps} onSignInClick={mockOnSignInClick} />);

      // Fill in form and trigger existing user error
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "existing@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText("Email already registered")).toBeInTheDocument();
      });

      // Click the sign in link
      await user.click(screen.getByRole("button", { name: "Sign in to join" }));

      expect(mockOnSignInClick).toHaveBeenCalled();
    });

    it("should reset error state on new form submission", async () => {
      const user = userEvent.setup();
      mockSignUp
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: "User already registered" } as AuthError,
        })
        .mockResolvedValueOnce({
          data: {
            user: {
              id: "new-user-id",
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: "2024-01-01T00:00:00Z",
              email: "new@example.com",
              role: "authenticated",
              updated_at: "2024-01-01T00:00:00Z",
            },
            session: null,
          },
          error: null,
        });

      render(<SignUpForm {...defaultProps} />);

      // First submission - existing user
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "existing@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByText("Email already registered")).toBeInTheDocument();
      });

      // Change email and submit again
      await user.clear(screen.getByTestId("email-input"));
      await user.type(screen.getByTestId("email-input"), "new@example.com");
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText("Email already registered")).not.toBeInTheDocument();
      });

      // Success should be called
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Tenant Association Error Handling", () => {
    it("should sign out user and show error if tenant association fails", async () => {
      const user = userEvent.setup();
      mockAssociateUserWithTenant.mockRejectedValue(new Error("Association failed"));

      render(<SignUpForm {...defaultProps} tenantSlug="test-church" inviteToken="invite-123" />);

      // Fill in form
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Create account failed",
          description: "Cannot join church: Error: Association failed",
          variant: "destructive",
        });
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state during form submission", async () => {
      const user = userEvent.setup();
      // Make signUp take some time
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    user: {
                      id: "test",
                      app_metadata: {},
                      user_metadata: {},
                      aud: "authenticated",
                      created_at: "2024-01-01T00:00:00Z",
                      email: "test@example.com",
                      role: "authenticated",
                      updated_at: "2024-01-01T00:00:00Z",
                    },
                    session: null,
                  },
                  error: null,
                }),
              100,
            ),
          ),
      );

      render(<SignUpForm {...defaultProps} />);

      // Fill in form
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      // Should show loading state
      expect(screen.getByRole("button", { name: "Creating account..." })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Creating account..." })).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
      });
    });

    it("should disable form fields during loading", async () => {
      const user = userEvent.setup();
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    user: {
                      id: "test",
                      app_metadata: {},
                      user_metadata: {},
                      aud: "authenticated",
                      created_at: "2024-01-01T00:00:00Z",
                      email: "test@example.com",
                      role: "authenticated",
                      updated_at: "2024-01-01T00:00:00Z",
                    },
                    session: null,
                  },
                  error: null,
                }),
              100,
            ),
          ),
      );

      render(<SignUpForm {...defaultProps} />);

      // Fill in form
      await user.type(screen.getByPlaceholderText("Enter your name"), "John Doe");
      await user.type(screen.getByTestId("email-input"), "john@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      // Form fields should be disabled
      expect(screen.getByTestId("email-input")).toBeDisabled();
      expect(screen.getByTestId("password-input")).toBeDisabled();
    });
  });

  describe("Navigation", () => {
    it("should call onSignInClick when footer link is clicked", async () => {
      const user = userEvent.setup();
      const mockOnSignInClick = jest.fn();

      render(<SignUpForm {...defaultProps} onSignInClick={mockOnSignInClick} />);

      await user.click(screen.getByRole("button", { name: "Already have an account?" }));

      expect(mockOnSignInClick).toHaveBeenCalled();
    });
  });
});
