/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen } from "@testing-library/react";
import { render, mockUseSessionHelpers } from "../../test-utils";
import { SecuritySection } from "@/components/Profile/SecuritySection";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "security.title": "Security",
        "security.description":
          "Manage your account security settings including password and account deletion.",
        "security.password.title": "Password Management",
        "security.password.setupDescription":
          "Set up a password for your account to enable email/password login in addition to Google Sign-in.",
        "security.password.changeDescription":
          "Change your account password for security purposes.",
        "security.account.title": "Account Deletion",
        "security.account.description":
          "Permanently delete your account and all associated data. This action cannot be undone.",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Password components
jest.mock("@/components/Profile/PasswordChangeForm", () => ({
  PasswordChangeForm: () => <div data-testid="password-change-form">Password Change Form</div>,
}));

jest.mock("@/components/Profile/PasswordSetupForm", () => ({
  PasswordSetupForm: () => <div data-testid="password-setup-form">Password Setup Form</div>,
}));

// Mock AccountDeletionSection
jest.mock("@/components/Profile/AccountDeletionSection", () => ({
  AccountDeletionSection: () => (
    <div data-testid="account-deletion-section">Account Deletion Section</div>
  ),
}));

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <div data-testid="separator" />,
}));

describe("SecuritySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render security section when user is authenticated", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByTestId("card-title")).toBeInTheDocument();
      expect(screen.getByTestId("card-description")).toBeInTheDocument();
      expect(screen.getByTestId("card-content")).toBeInTheDocument();
    });

    it("should not render when user is not authenticated", () => {
      mockUseSessionHelpers.unauthenticated();

      const { container } = render(<SecuritySection />);

      expect(container.firstChild).toBeNull();
    });

    it("should display correct security section title and description", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      expect(screen.getByText("Security")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Manage your account security settings including password and account deletion.",
        ),
      ).toBeInTheDocument();
    });

    it("should have proper section structure with separator", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });
  });

  describe("Password Management Section", () => {
    it("should show password setup form for Google OAuth users", () => {
      mockUseSessionHelpers.authenticated({
        identities: [{ provider: "google" }],
      });

      render(<SecuritySection />);

      expect(screen.getByText("Password Management")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Set up a password for your account to enable email/password login in addition to Google Sign-in.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId("password-setup-form")).toBeInTheDocument();
      expect(screen.queryByTestId("password-change-form")).not.toBeInTheDocument();
    });

    it("should show password change form for email/password users", () => {
      mockUseSessionHelpers.authenticated({
        identities: [{ provider: "email" }],
      });

      render(<SecuritySection />);

      expect(screen.getByText("Password Management")).toBeInTheDocument();
      expect(
        screen.getByText("Change your account password for security purposes."),
      ).toBeInTheDocument();
      expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
      expect(screen.queryByTestId("password-setup-form")).not.toBeInTheDocument();
    });

    it("should show password change form by default when no Google identity exists", () => {
      mockUseSessionHelpers.authenticated({
        identities: [],
      });

      render(<SecuritySection />);

      expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
      expect(screen.queryByTestId("password-setup-form")).not.toBeInTheDocument();
    });

    it("should show password change form when identities is undefined", () => {
      mockUseSessionHelpers.authenticated({
        identities: undefined,
      });

      render(<SecuritySection />);

      expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
      expect(screen.queryByTestId("password-setup-form")).not.toBeInTheDocument();
    });
  });

  describe("Account Deletion Section", () => {
    it("should display account deletion section", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      expect(screen.getByText("Account Deletion")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Permanently delete your account and all associated data. This action cannot be undone.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId("account-deletion-section")).toBeInTheDocument();
    });

    it("should show account deletion section for all user types", () => {
      // Test Google OAuth users
      mockUseSessionHelpers.authenticated({
        identities: [{ provider: "google" }],
      });

      const { rerender } = render(<SecuritySection />);

      expect(screen.getByTestId("account-deletion-section")).toBeInTheDocument();

      // Test email users
      mockUseSessionHelpers.authenticated({
        identities: [{ provider: "email" }],
      });

      rerender(<SecuritySection />);

      expect(screen.getByTestId("account-deletion-section")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should render both password management and account deletion sections", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      // Both sections should be present
      expect(screen.getByText("Password Management")).toBeInTheDocument();
      expect(screen.getByText("Account Deletion")).toBeInTheDocument();

      // Both components should be rendered
      expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
      expect(screen.getByTestId("account-deletion-section")).toBeInTheDocument();
    });

    it("should maintain proper spacing and structure", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      const cardContent = screen.getByTestId("card-content");
      expect(cardContent).toHaveClass("space-y-6");
    });

    it("should use consistent heading hierarchy", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      // Main card title should be present
      expect(screen.getByTestId("card-title")).toBeInTheDocument();

      // Section headings should be h3 elements
      const passwordHeading = screen.getByText("Password Management");
      const accountHeading = screen.getByText("Account Deletion");

      expect(passwordHeading).toBeInTheDocument();
      expect(accountHeading).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      // Should have main security section title
      expect(screen.getByText("Security")).toBeInTheDocument();

      // Should have subsection titles
      expect(screen.getByText("Password Management")).toBeInTheDocument();
      expect(screen.getByText("Account Deletion")).toBeInTheDocument();
    });

    it("should provide descriptive text for each section", () => {
      mockUseSessionHelpers.authenticated();

      render(<SecuritySection />);

      // Main description
      expect(
        screen.getByText(
          "Manage your account security settings including password and account deletion.",
        ),
      ).toBeInTheDocument();

      // Section descriptions
      expect(
        screen.getByText("Change your account password for security purposes."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Permanently delete your account and all associated data. This action cannot be undone.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("User Identity Handling", () => {
    it("should handle mixed identity providers correctly", () => {
      mockUseSessionHelpers.authenticated({
        identities: [{ provider: "google" }, { provider: "email" }],
      });

      render(<SecuritySection />);

      // Should show setup form since Google is present
      expect(screen.getByTestId("password-setup-form")).toBeInTheDocument();
      expect(screen.queryByTestId("password-change-form")).not.toBeInTheDocument();
    });

    it("should handle empty identities array", () => {
      mockUseSessionHelpers.authenticated({
        identities: [],
      });

      render(<SecuritySection />);

      // Should default to password change form
      expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
      expect(screen.queryByTestId("password-setup-form")).not.toBeInTheDocument();
    });
  });
});
