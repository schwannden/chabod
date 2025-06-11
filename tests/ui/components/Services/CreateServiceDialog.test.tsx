import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../../test-utils";
import { CreateServiceDialog } from "@/components/Services/CreateServiceDialog";
import * as services from "@/lib/services";

// Mock dialog components to prevent "Element type is invalid" errors
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  ),
  DialogTrigger: ({
    children,
    asChild: _asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (
    <div data-testid="dialog-trigger" {...props}>
      {children}
    </div>
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}));

// Mock Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid="button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// Mock the useServiceForm hook
const mockUseServiceForm = {
  form: {
    getValues: jest.fn(),
    handleSubmit: jest.fn(),
    reset: jest.fn(),
  },
  activeTab: "details",
  setActiveTab: jest.fn(),
  members: [],
  groups: [],
  selectedAdmins: [],
  setSelectedAdmins: jest.fn(),
  selectedGroups: [],
  setSelectedGroups: jest.fn(),
  notes: [],
  setNotes: jest.fn(),
  roles: [],
  setRoles: jest.fn(),
  isSubmitting: false,
  setIsSubmitting: jest.fn(),
  resetForm: jest.fn(),
};

jest.mock("@/components/Services/hooks/useServiceForm", () => ({
  useServiceForm: jest.fn(() => mockUseServiceForm),
}));

// Mock the ServiceForm component
jest.mock("@/components/Services/Forms/ServiceForm", () => ({
  ServiceForm: ({
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel,
    isEditing,
  }: {
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel: string;
    isEditing: boolean;
  }) => (
    <div data-testid="service-form">
      <div data-testid="form-state">{isSubmitting ? "submitting" : "idle"}</div>
      <div data-testid="submit-label">{submitLabel}</div>
      <div data-testid="is-editing">{isEditing ? "editing" : "creating"}</div>
      <button onClick={onSubmit} data-testid="form-submit">
        Submit
      </button>
      <button onClick={onCancel} data-testid="form-cancel">
        Cancel
      </button>
    </div>
  ),
}));

// Mock the service creation function
jest.mock("@/lib/services", () => ({
  createServiceWithAssociations: jest.fn(),
}));

// Mock toast
const mockToast = jest.fn();
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock translation
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("CreateServiceDialog", () => {
  const defaultProps = {
    tenantId: "test-tenant-id",
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSessionHelpers.authenticated();

    // Reset mock state
    mockUseServiceForm.notes = [];
    mockUseServiceForm.roles = [];

    // Mock form getValues
    mockUseServiceForm.form.getValues.mockReturnValue({
      name: "Sunday Service",
      tenant_id: "test-tenant-id",
      default_start_time: "09:00",
      default_end_time: "11:00",
    });
  });

  describe("Component Rendering", () => {
    it("should render the trigger button correctly", () => {
      render(<CreateServiceDialog {...defaultProps} />);

      expect(screen.getByRole("button", { name: "addServiceType" })).toBeInTheDocument();
    });

    it("should render service form with correct props when dialog is opened", async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByTestId("service-form")).toBeInTheDocument();
      });

      expect(screen.getByTestId("is-editing")).toHaveTextContent("creating");
      expect(screen.getByTestId("submit-label")).toHaveTextContent("addServiceType");
      expect(screen.getByTestId("form-state")).toHaveTextContent("idle");
    });
  });

  describe("Form Submission", () => {
    it("should call createServiceWithAssociations with correct data on form submit", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      // Wait for form to appear and submit
      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateService).toHaveBeenCalledWith(
          {
            name: "Sunday Service",
            tenant_id: "test-tenant-id",
            default_start_time: "09:00",
            default_end_time: "11:00",
          },
          [], // selectedAdmins
          [], // selectedGroups
          [], // notes
          [], // roles
        );
      });
    });

    it("should trim service name before submission", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});

      // Mock form with whitespace in name
      mockUseServiceForm.form.getValues.mockReturnValue({
        name: "  Sunday Service  ",
        tenant_id: "test-tenant-id",
        default_start_time: "09:00",
        default_end_time: "11:00",
      });

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateService).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Sunday Service", // Should be trimmed
          }),
          expect.any(Array),
          expect.any(Array),
          expect.any(Array),
          expect.any(Array),
        );
      });
    });

    it("should show success toast on successful creation", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "serviceTypeCreated",
          description: "serviceTypeCreatedSuccess",
        });
      });
    });

    it("should call onSuccess callback after successful creation", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});
      const mockOnSuccess = jest.fn();

      render(<CreateServiceDialog {...defaultProps} onSuccess={mockOnSuccess} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error toast on creation failure", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockRejectedValue(new Error("Creation failed"));

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "common:error",
          description: "createServiceTypeError",
          variant: "destructive",
        });
      });
    });
  });

  describe("Form Context Functionality", () => {
    it("should provide form context and handle form operations correctly", async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      // Test that the form renders correctly
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("service-form")).toBeInTheDocument();
      });

      // Verify that form context is provided by checking that form fields work
      expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      expect(screen.getByTestId("form-cancel")).toBeInTheDocument();
    });

    it("should reset form when dialog is closed", async () => {
      const user = userEvent.setup();
      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("service-form")).toBeInTheDocument();
      });

      // Close dialog via cancel
      const cancelButton = screen.getByTestId("form-cancel");
      await user.click(cancelButton);

      // Verify resetForm was called
      await waitFor(() => {
        expect(mockUseServiceForm.resetForm).toHaveBeenCalled();
      });
    });
  });

  describe("Data Validation", () => {
    it("should handle null time values", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});

      // Mock form with null time values
      mockUseServiceForm.form.getValues.mockReturnValue({
        name: "Sunday Service",
        tenant_id: "test-tenant-id",
        default_start_time: null,
        default_end_time: null,
      });

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateService).toHaveBeenCalledWith(
          {
            name: "Sunday Service",
            tenant_id: "test-tenant-id",
            default_start_time: null,
            default_end_time: null,
          },
          [], // selectedAdmins
          [], // selectedGroups
          [], // notes
          [], // roles
        );
      });
    });

    it("should validate and format notes properly", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});

      // Mock notes with potential undefined text
      mockUseServiceForm.notes = [
        { text: "Valid note", link: "https://example.com" },
        { text: undefined as string | undefined, link: "https://example2.com" },
      ];

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateService).toHaveBeenCalledWith(
          expect.any(Object),
          [], // selectedAdmins
          [], // selectedGroups
          [
            { text: "Valid note", link: "https://example.com" },
            { text: "", link: "https://example2.com" }, // undefined should become empty string
          ],
          [], // roles
        );
      });
    });

    it("should validate and format roles properly", async () => {
      const user = userEvent.setup();
      const mockCreateService = services.createServiceWithAssociations as jest.Mock;
      mockCreateService.mockResolvedValue({});

      // Reset the mock and set roles with potential undefined name
      mockUseServiceForm.roles = [
        { name: "Valid role", description: "A valid role" },
        { name: undefined as string | undefined, description: "Invalid role" },
      ];
      mockUseServiceForm.notes = []; // Reset notes to empty

      render(<CreateServiceDialog {...defaultProps} />);

      // Open dialog and submit
      const triggerButton = screen.getByRole("button", { name: "addServiceType" });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId("form-submit")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("form-submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateService).toHaveBeenCalledWith(
          expect.any(Object),
          [], // selectedAdmins
          [], // selectedGroups
          [], // notes
          [
            { name: "Valid role", description: "A valid role" },
            { name: "", description: "Invalid role" }, // undefined should become empty string
          ],
        );
      });
    });
  });
});
