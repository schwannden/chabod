/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../../test-utils";
import { AccountDeletionSection } from "@/components/Profile/AccountDeletionSection";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Simple key resolution for testing
      const translations: Record<string, string> = {
        "deleteAccount.title": "Delete Account",
        "deleteAccount.description":
          "Permanently delete your account and all associated data. This action cannot be undone.",
        "deleteAccount.button": "Delete My Account",
        "deleteAccount.warningTitle": "This action cannot be undone. This will:",
        "deleteAccount.warningItem1": "Permanently delete your profile and account",
        "deleteAccount.warningItem2": "Remove you from all organizations and groups",
        "deleteAccount.warningItem3": "Delete all your personal data",
        "deleteAccount.warningItem4": "Cancel any active subscriptions",
        "deleteAccount.gdprNote":
          "In compliance with GDPR regulations, all your personal data will be permanently removed from our systems within 30 days.",
        "deleteAccount.cannotDelete": "Cannot Delete Account",
        "deleteAccount.blockerSoleTenantOwner": `You are the sole owner of '${params?.tenantName || "Organization"}'. Please transfer ownership or delete the organization first.`,
        "deleteAccount.blockerUnknown": `Unknown restriction: ${params?.type || "unknown"}`,
        "deleteAccount.blockerResolution":
          "Please resolve the above restrictions before attempting to delete your account.",
        "deleteAccount.confirmTitle": "Delete Account",
        "deleteAccount.confirmDescription":
          "Are you absolutely sure you want to delete your account? Type your email address below to confirm.",
        "deleteAccount.confirmPlaceholder": "Type your email address",
        "deleteAccount.confirmButton": "Delete Account Permanently",
        "common:processing": "Processing...",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the useAccountDeletion hook
const mockUseAccountDeletion = {
  isLoading: false,
  isChecking: false,
  eligibility: null,
  checkEligibility: jest.fn(),
  initiateDeletion: jest.fn(),
  confirmDeletion: jest.fn(),
  reset: jest.fn(),
};

jest.mock("@/hooks/useAccountDeletion", () => ({
  useAccountDeletion: jest.fn(() => mockUseAccountDeletion),
}));

// Mock HighRiskDeleteDialog
jest.mock("@/components/shared/HighRiskDeleteDialog", () => ({
  HighRiskDeleteDialog: ({ isOpen, onConfirm, onClose, title, description }: any) => (
    <div data-testid="high-risk-delete-dialog" style={{ display: isOpen ? "block" : "none" }}>
      <div data-testid="dialog-title">{title}</div>
      <div data-testid="dialog-description">{description}</div>
      <button data-testid="dialog-confirm-btn" onClick={onConfirm}>
        Confirm Delete
      </button>
      <button data-testid="dialog-cancel-btn" onClick={onClose}>
        Cancel
      </button>
    </div>
  ),
}));

// Mock UI components
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  UserX: () => <div data-testid="user-x-icon" />,
}));

// Mock UI Alert components
jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children, variant, ...props }: any) => (
    <div data-testid={`alert-${variant || "default"}`} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}));

// Note: AccountDeletionSection no longer uses Card components - they are handled by SecuritySection

// Mock Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe("AccountDeletionSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountDeletion.isLoading = false;
    mockUseAccountDeletion.isChecking = false;
    mockUseAccountDeletion.eligibility = null;
    mockUseSessionHelpers.authenticated();
  });

  describe("Rendering", () => {
    it("should render delete account section when user is authenticated", () => {
      mockUseSessionHelpers.authenticated();

      render(<AccountDeletionSection />);

      // AccountDeletionSection now renders as a div with space-y-4, not a Card
      expect(screen.getByTestId("button")).toBeInTheDocument();
      expect(screen.getByTestId("alert-destructive")).toBeInTheDocument();
    });

    it("should not render when user is not authenticated", () => {
      mockUseSessionHelpers.unauthenticated();

      const { container } = render(<AccountDeletionSection />);

      expect(container.firstChild).toBeNull();
    });

    it("should show warning messages about data deletion", () => {
      mockUseSessionHelpers.authenticated();

      render(<AccountDeletionSection />);

      expect(screen.getAllByText(/This action cannot be undone/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Permanently delete your profile/)).toBeInTheDocument();
      expect(screen.getByText(/Remove you from all organizations/)).toBeInTheDocument();
      expect(screen.getByText(/Delete all your personal data/)).toBeInTheDocument();
    });

    it("should show GDPR compliance note", () => {
      mockUseSessionHelpers.authenticated();

      render(<AccountDeletionSection />);

      expect(screen.getByText(/GDPR regulations/)).toBeInTheDocument();
      expect(screen.getByText(/30 days/)).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call checkEligibility when delete button is clicked", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockResolvedValueOnce({
        canDelete: true,
        blockers: [],
      });

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      expect(mockUseAccountDeletion.checkEligibility).toHaveBeenCalledTimes(1);
    });

    it("should show confirmation dialog when user can delete account", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockResolvedValueOnce({
        canDelete: true,
        blockers: [],
      });
      mockUseAccountDeletion.initiateDeletion.mockResolvedValueOnce({
        requiresConfirmation: true,
      });

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId("high-risk-delete-dialog")).toBeVisible();
      });
    });

    it("should not show dialog when user cannot delete account", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockResolvedValueOnce({
        canDelete: false,
        blockers: [{ type: "sole_tenant_owner", tenantId: "tenant-1", tenantName: "Test Org" }],
      });

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByTestId("high-risk-delete-dialog")).not.toBeVisible();
      });
    });

    it("should call confirmDeletion when dialog confirm is clicked", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockResolvedValueOnce({
        canDelete: true,
        blockers: [],
      });
      mockUseAccountDeletion.initiateDeletion.mockResolvedValueOnce({
        requiresConfirmation: true,
      });
      mockUseAccountDeletion.confirmDeletion.mockResolvedValueOnce(undefined);

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId("high-risk-delete-dialog")).toBeVisible();
      });

      const confirmButton = screen.getByTestId("dialog-confirm-btn");
      await userEvent.click(confirmButton);

      expect(mockUseAccountDeletion.confirmDeletion).toHaveBeenCalledWith();
    });

    it("should close dialog when cancel is clicked", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockResolvedValueOnce({
        canDelete: true,
        blockers: [],
      });
      mockUseAccountDeletion.initiateDeletion.mockResolvedValueOnce({
        requiresConfirmation: true,
      });

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId("high-risk-delete-dialog")).toBeVisible();
      });

      const cancelButton = screen.getByTestId("dialog-cancel-btn");
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByTestId("high-risk-delete-dialog")).not.toBeVisible();
      });
    });
  });

  describe("Loading States", () => {
    it("should show processing text when checking eligibility", () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.isChecking = true;

      render(<AccountDeletionSection />);

      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.getByText("Processing...")).toBeDisabled();
    });

    it("should show processing text when deletion is in progress", () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.isLoading = true;

      render(<AccountDeletionSection />);

      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.getByText("Processing...")).toBeDisabled();
    });

    it("should disable button during processing", () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.isLoading = true;

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Processing...");
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("Blocker Scenarios", () => {
    it("should show blocker messages when user is sole tenant owner", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.eligibility = {
        canDelete: false,
        blockers: [
          { type: "sole_tenant_owner", tenantId: "tenant-1", tenantName: "My Organization" },
        ],
      };

      render(<AccountDeletionSection />);

      expect(screen.getByText("Cannot Delete Account")).toBeInTheDocument();
      expect(screen.getByText(/My Organization/)).toBeInTheDocument();
      expect(screen.getByText(/transfer ownership/i)).toBeInTheDocument();
    });

    it("should show resolution instructions for blockers", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.eligibility = {
        canDelete: false,
        blockers: [{ type: "sole_tenant_owner", tenantId: "tenant-1", tenantName: "Test Org" }],
      };

      render(<AccountDeletionSection />);

      expect(screen.getByText(/resolve the above restrictions/i)).toBeInTheDocument();
    });

    it("should handle multiple blockers", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.eligibility = {
        canDelete: false,
        blockers: [
          { type: "sole_tenant_owner", tenantId: "tenant-1", tenantName: "Org 1" },
          { type: "sole_tenant_owner", tenantId: "tenant-2", tenantName: "Org 2" },
        ],
      };

      render(<AccountDeletionSection />);

      expect(screen.getByText(/Org 1/)).toBeInTheDocument();
      expect(screen.getByText(/Org 2/)).toBeInTheDocument();
    });

    it("should handle unknown blocker types", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.eligibility = {
        canDelete: false,
        blockers: [{ type: "unknown_blocker", tenantId: "tenant-1", tenantName: "Test Org" }],
      };

      render(<AccountDeletionSection />);

      expect(screen.getByText(/Unknown restriction: unknown_blocker/)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle eligibility check errors gracefully", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockRejectedValueOnce(new Error("Network error"));

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      // Component should not crash and dialog should not appear
      await waitFor(() => {
        expect(screen.queryByTestId("high-risk-delete-dialog")).not.toBeVisible();
      });
    });

    it("should handle deletion errors gracefully", async () => {
      mockUseSessionHelpers.authenticated();
      mockUseAccountDeletion.checkEligibility.mockResolvedValueOnce({
        canDelete: true,
        blockers: [],
      });
      mockUseAccountDeletion.initiateDeletion.mockResolvedValueOnce({
        requiresConfirmation: true,
      });
      mockUseAccountDeletion.confirmDeletion.mockRejectedValueOnce(new Error("Deletion failed"));

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByText("Delete My Account");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId("high-risk-delete-dialog")).toBeVisible();
      });

      const confirmButton = screen.getByTestId("dialog-confirm-btn");
      await userEvent.click(confirmButton);

      // Component should handle the error gracefully
      expect(mockUseAccountDeletion.confirmDeletion).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      mockUseSessionHelpers.authenticated();

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByRole("button", { name: /delete my account/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it("should be keyboard accessible", () => {
      mockUseSessionHelpers.authenticated();

      render(<AccountDeletionSection />);

      const deleteButton = screen.getByTestId("button");

      // Test that button can be focused
      deleteButton.focus();
      expect(deleteButton).toHaveFocus();
    });
  });
});
