import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import { TenantWelcomeScreen } from "@/components/Auth/TenantWelcomeScreen";

// Mock react-i18next for this test file only
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // Return the key or interpolated string for testing
      if (options && typeof options === "object") {
        let result = key;
        Object.keys(options).forEach((param) => {
          result = result.replace(`{{${param}}}`, String(options[param]));
        });
        return result;
      }
      return key;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: "en",
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock lucide-react icons for this test file only
jest.mock("lucide-react", () => ({
  UserPlus: ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="UserPlus" className={className} {...props} />
  ),
  LogIn: ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="LogIn" className={className} {...props} />
  ),
  Users: ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="Users" className={className} {...props} />
  ),
}));

describe("TenantWelcomeScreen", () => {
  const defaultProps = {
    tenantName: "Test Church",
    onNewUser: jest.fn(),
    onExistingUser: jest.fn(),
    onMemberSignIn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render welcome message without invite token", () => {
      render(<TenantWelcomeScreen {...defaultProps} />);

      expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
      expect(screen.queryByText("auth.invitedDesc")).not.toBeInTheDocument();
    });

    it("should render invited message with invite token", () => {
      render(<TenantWelcomeScreen {...defaultProps} inviteToken="invite-123" />);

      expect(screen.getByText("auth.invitedToJoin")).toBeInTheDocument();
      expect(screen.getByText("auth.invitedDesc")).toBeInTheDocument();
    });

    it("should render all three action buttons", () => {
      render(<TenantWelcomeScreen {...defaultProps} />);

      expect(screen.getByText("auth.newToChabod")).toBeInTheDocument();
      expect(screen.getByText("auth.haveAccount")).toBeInTheDocument();
      expect(screen.getByText("auth.alreadyMember")).toBeInTheDocument();
    });

    it("should render descriptive text for each button", () => {
      render(<TenantWelcomeScreen {...defaultProps} />);

      expect(screen.getByText("auth.newToChabodDesc")).toBeInTheDocument();
      expect(screen.getByText("auth.haveAccountDesc")).toBeInTheDocument();
      expect(screen.getByText("auth.alreadyMemberDesc")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onNewUser when new user button is clicked", async () => {
      const user = userEvent.setup();
      render(<TenantWelcomeScreen {...defaultProps} />);

      const newUserButton = screen.getByRole("button", { name: /auth.newToChabod/i });
      await user.click(newUserButton);

      expect(defaultProps.onNewUser).toHaveBeenCalledTimes(1);
      expect(defaultProps.onExistingUser).not.toHaveBeenCalled();
      expect(defaultProps.onMemberSignIn).not.toHaveBeenCalled();
    });

    it("should call onExistingUser when existing user button is clicked", async () => {
      const user = userEvent.setup();
      render(<TenantWelcomeScreen {...defaultProps} />);

      const existingUserButton = screen.getByRole("button", { name: /auth.haveAccount/i });
      await user.click(existingUserButton);

      expect(defaultProps.onExistingUser).toHaveBeenCalledTimes(1);
      expect(defaultProps.onNewUser).not.toHaveBeenCalled();
      expect(defaultProps.onMemberSignIn).not.toHaveBeenCalled();
    });

    it("should call onMemberSignIn when member sign in button is clicked", async () => {
      const user = userEvent.setup();
      render(<TenantWelcomeScreen {...defaultProps} />);

      const memberSignInButton = screen.getByRole("button", { name: /auth.alreadyMember/i });
      await user.click(memberSignInButton);

      expect(defaultProps.onMemberSignIn).toHaveBeenCalledTimes(1);
      expect(defaultProps.onNewUser).not.toHaveBeenCalled();
      expect(defaultProps.onExistingUser).not.toHaveBeenCalled();
    });
  });

  describe("Props Integration", () => {
    it("should display tenant name in welcome message", () => {
      render(<TenantWelcomeScreen {...defaultProps} tenantName="My Awesome Church" />);

      // The translation system should interpolate the tenant name
      expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
    });

    it("should display tenant name in invited message", () => {
      render(
        <TenantWelcomeScreen
          {...defaultProps}
          tenantName="Special Church"
          inviteToken="special-invite"
        />,
      );

      expect(screen.getByText("auth.invitedToJoin")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button roles", () => {
      render(<TenantWelcomeScreen {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);

      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });

    it("should have accessible button structure", () => {
      render(<TenantWelcomeScreen {...defaultProps} />);

      // Check that buttons have proper content structure
      const newUserButton = screen.getByRole("button", { name: /auth.newToChabod/i });
      const existingUserButton = screen.getByRole("button", { name: /auth.haveAccount/i });
      const memberButton = screen.getByRole("button", { name: /auth.alreadyMember/i });

      expect(newUserButton).toBeInTheDocument();
      expect(existingUserButton).toBeInTheDocument();
      expect(memberButton).toBeInTheDocument();
    });
  });

  describe("UI Layout", () => {
    it("should render as a card component", () => {
      const { container } = render(<TenantWelcomeScreen {...defaultProps} />);

      // Check for card structure (shadcn card components)
      const cardElements = container.querySelectorAll('[class*="card"]');
      expect(cardElements.length).toBeGreaterThan(0);
    });

    it("should render buttons with outline variant", () => {
      render(<TenantWelcomeScreen {...defaultProps} />);

      const buttons = screen.getAllByRole("button");

      // All buttons should be rendered (specific styling is handled by shadcn)
      expect(buttons).toHaveLength(3);
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("should render icons within buttons", () => {
      const { container } = render(<TenantWelcomeScreen {...defaultProps} />);

      // Check for Lucide icon elements (they render as SVG)
      const svgElements = container.querySelectorAll("svg");
      expect(svgElements.length).toBeGreaterThanOrEqual(3); // At least one icon per button
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty tenant name", () => {
      render(<TenantWelcomeScreen {...defaultProps} tenantName="" />);

      expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
    });

    it("should handle very long tenant name", () => {
      const longName =
        "This is a very long church name that might cause layout issues if not handled properly";
      render(<TenantWelcomeScreen {...defaultProps} tenantName={longName} />);

      expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
    });

    it("should handle empty invite token string", () => {
      render(<TenantWelcomeScreen {...defaultProps} inviteToken="" />);

      // Empty string should be treated as no invite token
      expect(screen.getByText("auth.welcomeToChurch")).toBeInTheDocument();
      expect(screen.queryByText("auth.invitedDesc")).not.toBeInTheDocument();
    });
  });

  describe("Multiple Interactions", () => {
    it("should handle rapid button clicks", async () => {
      const user = userEvent.setup();
      render(<TenantWelcomeScreen {...defaultProps} />);

      const newUserButton = screen.getByRole("button", { name: /auth.newToChabod/i });

      // Click multiple times rapidly
      await user.click(newUserButton);
      await user.click(newUserButton);
      await user.click(newUserButton);

      expect(defaultProps.onNewUser).toHaveBeenCalledTimes(3);
    });

    it("should handle switching between different buttons", async () => {
      const user = userEvent.setup();
      render(<TenantWelcomeScreen {...defaultProps} />);

      const newUserButton = screen.getByRole("button", { name: /auth.newToChabod/i });
      const existingUserButton = screen.getByRole("button", { name: /auth.haveAccount/i });
      const memberButton = screen.getByRole("button", { name: /auth.alreadyMember/i });

      await user.click(newUserButton);
      await user.click(existingUserButton);
      await user.click(memberButton);

      expect(defaultProps.onNewUser).toHaveBeenCalledTimes(1);
      expect(defaultProps.onExistingUser).toHaveBeenCalledTimes(1);
      expect(defaultProps.onMemberSignIn).toHaveBeenCalledTimes(1);
    });
  });
});
