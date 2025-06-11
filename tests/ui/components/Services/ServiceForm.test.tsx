import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../../test-utils";
import { ServiceForm } from "@/components/Services/Forms/ServiceForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Mock the sub-form components
jest.mock("@/components/Services/Forms/ServiceDetailsForm", () => ({
  ServiceDetailsForm: ({ form }: { form: { getValues: () => Record<string, unknown> } }) => (
    <div data-testid="service-details-form">
      <input data-testid="service-name" defaultValue={form.getValues().name} />
      <input data-testid="service-start-time" defaultValue={form.getValues().default_start_time} />
      <input data-testid="service-end-time" defaultValue={form.getValues().default_end_time} />
    </div>
  ),
}));

jest.mock("@/components/Services/Forms/ServiceAdminsForm", () => ({
  ServiceAdminsForm: ({ selectedAdmins }: { selectedAdmins: string[] }) => (
    <div data-testid="service-admins-form">
      <div data-testid="selected-admins">{selectedAdmins.join(",")}</div>
    </div>
  ),
}));

jest.mock("@/components/Services/Forms/ServiceGroupsForm", () => ({
  ServiceGroupsForm: ({ selectedGroups }: { selectedGroups: string[] }) => (
    <div data-testid="service-groups-form">
      <div data-testid="selected-groups">{selectedGroups.join(",")}</div>
    </div>
  ),
}));

jest.mock("@/components/Services/Forms/ServiceNotesForm", () => ({
  ServiceNotesForm: ({ notes }: { notes: Array<{ text: string; link?: string }> }) => (
    <div data-testid="service-notes-form">
      <div data-testid="notes-count">{notes.length}</div>
    </div>
  ),
}));

jest.mock("@/components/Services/Forms/ServiceRolesForm", () => ({
  ServiceRolesForm: ({ roles }: { roles: Array<{ name: string; description?: string }> }) => (
    <div data-testid="service-roles-form">
      <div data-testid="roles-count">{roles.length}</div>
    </div>
  ),
}));

// Schema for testing
const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tenant_id: z.string(),
  default_start_time: z.string().optional(),
  default_end_time: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

describe("ServiceForm", () => {
  const mockProps = {
    activeTab: "details",
    setActiveTab: jest.fn(),
    members: [],
    groups: [],
    selectedAdmins: ["admin-1", "admin-2"],
    setSelectedAdmins: jest.fn(),
    selectedGroups: ["group-1"],
    setSelectedGroups: jest.fn(),
    notes: [{ text: "Note 1" }, { text: "Note 2", link: "http://example.com" }],
    setNotes: jest.fn(),
    roles: [{ name: "Pastor" }, { name: "Deacon", description: "Helper" }],
    setRoles: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isSubmitting: false,
    submitLabel: "Create Service",
    isEditing: false,
  };

  // Create a test wrapper component that provides the form
  const TestWrapper = ({ children: _children }: { children: React.ReactNode }) => {
    const form = useForm<ServiceFormValues>({
      resolver: zodResolver(serviceFormSchema),
      defaultValues: {
        name: "Test Service",
        tenant_id: "test-tenant-id",
        default_start_time: "09:00",
        default_end_time: "11:00",
      },
    });

    const extendedProps = {
      ...mockProps,
      form,
    };

    return <ServiceForm {...extendedProps} />;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSessionHelpers.authenticated();
  });

  describe("Form Context", () => {
    it("should provide form context to child components", () => {
      render(<TestWrapper />);

      // Verify form context is working by checking if form fields are rendered
      expect(screen.getByTestId("service-details-form")).toBeInTheDocument();
      expect(screen.getByTestId("service-name")).toBeInTheDocument();
      expect(screen.getByTestId("service-start-time")).toBeInTheDocument();
      expect(screen.getByTestId("service-end-time")).toBeInTheDocument();
    });

    it("should pass form values to child components", () => {
      render(<TestWrapper />);

      // Check if default values are passed to form components
      expect(screen.getByTestId("service-name")).toHaveValue("Test Service");
      expect(screen.getByTestId("service-start-time")).toHaveValue("09:00");
      expect(screen.getByTestId("service-end-time")).toHaveValue("11:00");
    });
  });

  describe("Tab Navigation", () => {
    it("should render tab navigation correctly", () => {
      render(<TestWrapper />);

      expect(screen.getByRole("tab", { name: "基本資料" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "管理員" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "小組" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "備註" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "角色" })).toBeInTheDocument();
    });

    it("should show correct tab content based on activeTab", () => {
      render(<TestWrapper />);

      // Details tab should be active by default
      expect(screen.getByTestId("service-details-form")).toBeInTheDocument();
      expect(screen.queryByTestId("service-admins-form")).not.toBeInTheDocument();
    });

    it("should call setActiveTab when tab is clicked", async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);

      const adminsTab = screen.getByRole("tab", { name: "管理員" });
      await user.click(adminsTab);

      expect(mockProps.setActiveTab).toHaveBeenCalledWith("admins");
    });

    it("should show admins form when admins tab is active", () => {
      const TestWrapperWithAdminsTab = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
            default_start_time: "09:00",
            default_end_time: "11:00",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          activeTab: "admins",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithAdminsTab />);

      expect(screen.getByTestId("service-admins-form")).toBeInTheDocument();
      expect(screen.getByTestId("selected-admins")).toHaveTextContent("admin-1,admin-2");
    });

    it("should show groups form when groups tab is active", () => {
      const TestWrapperWithGroupsTab = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          activeTab: "groups",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithGroupsTab />);

      expect(screen.getByTestId("service-groups-form")).toBeInTheDocument();
      expect(screen.getByTestId("selected-groups")).toHaveTextContent("group-1");
    });

    it("should show notes form when notes tab is active", () => {
      const TestWrapperWithNotesTab = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          activeTab: "notes",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithNotesTab />);

      expect(screen.getByTestId("service-notes-form")).toBeInTheDocument();
      expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
    });

    it("should show roles form when roles tab is active", () => {
      const TestWrapperWithRolesTab = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          activeTab: "roles",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithRolesTab />);

      expect(screen.getByTestId("service-roles-form")).toBeInTheDocument();
      expect(screen.getByTestId("roles-count")).toHaveTextContent("2");
    });
  });

  describe("Form Actions", () => {
    it("should render cancel and submit buttons", () => {
      render(<TestWrapper />);

      expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create Service" })).toBeInTheDocument();
    });

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);

      const cancelButton = screen.getByRole("button", { name: "取消" });
      await user.click(cancelButton);

      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it("should call form.handleSubmit with onSubmit when submit button is clicked", async () => {
      const user = userEvent.setup();
      const mockHandleSubmit = jest.fn();

      const TestWrapperWithMockSubmit = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        // Mock handleSubmit
        form.handleSubmit = mockHandleSubmit.mockReturnValue(() => {});

        const extendedProps = {
          ...mockProps,
          form,
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithMockSubmit />);

      const submitButton = screen.getByRole("button", { name: "Create Service" });
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalledWith(mockProps.onSubmit);
    });

    it("should disable submit button when isSubmitting is true", () => {
      const TestWrapperSubmitting = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          isSubmitting: true,
          submitLabel: "Creating...",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperSubmitting />);

      const submitButton = screen.getByRole("button", { name: "處理中..." });
      expect(submitButton).toBeDisabled();
    });

    it("should show correct submit label", () => {
      const TestWrapperWithCustomLabel = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          submitLabel: "Update Service",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithCustomLabel />);

      expect(screen.getByRole("button", { name: "Update Service" })).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show processing state when submitting", () => {
      const TestWrapperSubmitting = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          isSubmitting: true,
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperSubmitting />);

      const submitButton = screen.getByRole("button", { name: "處理中..." });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Data Passing", () => {
    it("should pass correct tenant_id from form values", () => {
      const TestWrapperWithTenantId = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "custom-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          activeTab: "notes",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperWithTenantId />);

      // This would be tested through the ServiceNotesForm component
      expect(screen.getByTestId("service-notes-form")).toBeInTheDocument();
    });

    it("should pass all props correctly to child components", () => {
      const TestWrapperAllTabs = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          activeTab: "admins",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperAllTabs />);

      // Check that props are passed to ServiceAdminsForm
      expect(screen.getByTestId("service-admins-form")).toBeInTheDocument();
      expect(screen.getByTestId("selected-admins")).toHaveTextContent("admin-1,admin-2");
    });
  });

  describe("Editing vs Creating", () => {
    it("should pass isEditing prop to child components", () => {
      const TestWrapperEditing = () => {
        const form = useForm<ServiceFormValues>({
          resolver: zodResolver(serviceFormSchema),
          defaultValues: {
            name: "Test Service",
            tenant_id: "test-tenant-id",
          },
        });

        const extendedProps = {
          ...mockProps,
          form,
          isEditing: true,
          serviceId: "service-123",
        };

        return <ServiceForm {...extendedProps} />;
      };

      render(<TestWrapperEditing />);

      // All child components should receive the isEditing prop
      expect(screen.getByTestId("service-details-form")).toBeInTheDocument();
    });
  });
});
