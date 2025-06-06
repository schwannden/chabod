import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import ServicePage from "@/pages/tenant/ServicePage";
import { useSession } from "@/hooks/useSession";
import * as tenantUtils from "@/lib/tenant-utils";
import * as serviceCore from "@/lib/services/service-core";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ slug: "test-church" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Get the mocked useSession
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock TenantPageLayout component
jest.mock("@/components/Layout/TenantPageLayout", () => ({
  TenantPageLayout: ({
    children,
    title,
    description,
    tenantName,
    tenantSlug,
    isLoading,
    breadcrumbItems,
    action,
  }: {
    children: React.ReactNode;
    title: string;
    description?: string;
    tenantName: string;
    tenantSlug: string;
    isLoading?: boolean;
    breadcrumbItems: Array<{ label: string; path?: string }>;
    action?: React.ReactNode;
  }) => (
    <div data-testid="tenant-page-layout">
      <div data-testid="layout-title">{title}</div>
      <div data-testid="layout-description">{description}</div>
      <div data-testid="layout-tenant-name">{tenantName}</div>
      <div data-testid="layout-tenant-slug">{tenantSlug}</div>
      <div data-testid="layout-loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="layout-breadcrumbs">
        {breadcrumbItems.map((item, index) => (
          <span key={index} data-testid={`breadcrumb-${index}`}>
            {item.label}
          </span>
        ))}
      </div>
      <div data-testid="layout-action">{action}</div>
      {children}
    </div>
  ),
}));

// Mock ServiceCard component
jest.mock("@/components/Services/ServiceCard", () => ({
  ServiceCard: ({
    service,
    onEdit,
    onDeleted,
  }: {
    service: {
      id: string;
      name: string;
      default_start_time?: string;
      default_end_time?: string;
      tenant_id: string;
    };
    onEdit: (service: {
      id: string;
      name: string;
      default_start_time?: string;
      default_end_time?: string;
      tenant_id: string;
    }) => void;
    onDeleted: () => void;
  }) => (
    <div data-testid={`service-card-${service.id}`}>
      <div data-testid="service-name">{service.name}</div>
      <div data-testid="service-time">
        {service.default_start_time && service.default_end_time
          ? `${service.default_start_time} - ${service.default_end_time}`
          : "services.notSetDefaultTime"}
      </div>
      <button onClick={() => onEdit(service)} data-testid="edit-service">
        Edit Service
      </button>
      <button onClick={onDeleted} data-testid="trigger-deleted">
        Trigger Deleted
      </button>
    </div>
  ),
}));

// Mock CreateServiceDialog component
jest.mock("@/components/Services/CreateServiceDialog", () => ({
  CreateServiceDialog: ({ tenantId, onSuccess }: { tenantId: string; onSuccess?: () => void }) => (
    <div data-testid="create-service-dialog">
      <div data-testid="tenant-id">{tenantId}</div>
      <button onClick={onSuccess} data-testid="trigger-success">
        Trigger Success
      </button>
    </div>
  ),
}));

// Mock EditServiceDialog component
jest.mock("@/components/Services/EditServiceDialog", () => ({
  EditServiceDialog: ({
    service,
    open,
    onOpenChange,
    onSuccess,
  }: {
    service: {
      id: string;
      name: string;
      default_start_time?: string;
      default_end_time?: string;
      tenant_id: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
  }) => (
    <>
      {open && (
        <div data-testid="edit-service-dialog">
          <div data-testid="editing-service-id">{service?.id}</div>
          <div data-testid="editing-service-name">{service?.name}</div>
          <button onClick={() => onOpenChange(false)} data-testid="close-dialog">
            Close Dialog
          </button>
          <button onClick={onSuccess} data-testid="trigger-edit-success">
            Trigger Edit Success
          </button>
        </div>
      )}
    </>
  ),
}));

// Mock the service functions
jest.mock("@/lib/tenant-utils", () => ({
  getTenantBySlug: jest.fn(),
}));

jest.mock("@/lib/services/service-core", () => ({
  getServices: jest.fn(),
}));

// Mock useTenantRole hook
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(),
}));

describe("ServicePage", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
    role: "authenticated",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockTenant = {
    id: "tenant-1",
    name: "Test Church",
    slug: "test-church",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    price_tier_id: "basic",
  };

  const mockServices = [
    {
      id: "service-1",
      name: "Sunday Morning Service",
      default_start_time: "09:00:00",
      default_end_time: "11:00:00",
      tenant_id: "tenant-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "service-2",
      name: "Wednesday Prayer",
      default_start_time: null,
      default_end_time: null,
      tenant_id: "tenant-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  // Import useTenantRole hook for mocking
  const { useTenantRole } = jest.requireMock("@/hooks/useTenantRole") as {
    useTenantRole: jest.MockedFunction<typeof import("@/hooks/useTenantRole").useTenantRole>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Set up default mocks
    (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(mockTenant);
    (serviceCore.getServices as jest.Mock).mockResolvedValue(mockServices);
    useTenantRole.mockReturnValue({ role: "member", isLoading: false });

    // Default authenticated user
    mockUseSession.mockReturnValue({
      session: null,
      user: mockUser,
      profile: null,
      isLoading: false,
      signOut: jest.fn(),
    });
  });

  describe("Authentication and Navigation", () => {
    it("should redirect to auth page when user is not authenticated", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ServicePage />);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should not redirect when session is loading", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<ServicePage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should not redirect when user is authenticated", async () => {
      render(<ServicePage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Rendering", () => {
    it("should render correctly with required data", async () => {
      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("tenant-page-layout")).toBeInTheDocument();
        expect(screen.getByTestId("layout-title")).toHaveTextContent(
          "dashboard.serviceManagementTitle",
        );
        expect(screen.getByTestId("layout-description")).toHaveTextContent(
          "dashboard.serviceManagementDesc",
        );
        expect(screen.getByTestId("layout-tenant-name")).toHaveTextContent("Test Church");
        expect(screen.getByTestId("layout-tenant-slug")).toHaveTextContent("test-church");
      });
    });

    it("should show loading state initially", () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves

      render(<ServicePage />);

      expect(screen.getByTestId("layout-loading")).toHaveTextContent("loading");
    });

    it("should display breadcrumb correctly", async () => {
      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("breadcrumb-0")).toHaveTextContent(
          "dashboard.serviceManagementTitle",
        );
      });
    });
  });

  describe("Service Management Authorization", () => {
    it("should show create service dialog when user is tenant owner", async () => {
      useTenantRole.mockReturnValue({ role: "owner", isLoading: false });

      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("create-service-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("tenant-id")).toHaveTextContent("tenant-1");
      });
    });

    it("should not show create service dialog when user is not tenant owner", async () => {
      useTenantRole.mockReturnValue({ role: "member", isLoading: false });

      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("create-service-dialog")).not.toBeInTheDocument();
      });
    });

    it("should not show create service dialog when role is loading", async () => {
      useTenantRole.mockReturnValue({ role: null, isLoading: true });

      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("create-service-dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Service Display", () => {
    it("should display services when available", async () => {
      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("service-card-service-1")).toBeInTheDocument();
        expect(screen.getByTestId("service-card-service-2")).toBeInTheDocument();
      });

      // Check service details
      const service1Card = screen.getByTestId("service-card-service-1");
      expect(service1Card.querySelector('[data-testid="service-name"]')).toHaveTextContent(
        "Sunday Morning Service",
      );
      expect(service1Card.querySelector('[data-testid="service-time"]')).toHaveTextContent(
        "09:00:00 - 11:00:00",
      );

      const service2Card = screen.getByTestId("service-card-service-2");
      expect(service2Card.querySelector('[data-testid="service-name"]')).toHaveTextContent(
        "Wednesday Prayer",
      );
      expect(service2Card.querySelector('[data-testid="service-time"]')).toHaveTextContent(
        "services.notSetDefaultTime",
      );
    });

    it("should show no services message when no services exist", async () => {
      (serviceCore.getServices as jest.Mock).mockResolvedValue([]);

      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByText("services.noServiceTypesYet")).toBeInTheDocument();
        expect(screen.queryByTestId("service-card-service-1")).not.toBeInTheDocument();
      });
    });

    it("should show loading message while services are loading", () => {
      (serviceCore.getServices as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves

      render(<ServicePage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });
  });

  describe("Service Editing", () => {
    it("should open edit dialog when service edit is triggered", async () => {
      const user = userEvent.setup();
      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("service-card-service-1")).toBeInTheDocument();
      });

      const editButton = screen.getAllByTestId("edit-service")[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-service-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("editing-service-id")).toHaveTextContent("service-1");
        expect(screen.getByTestId("editing-service-name")).toHaveTextContent(
          "Sunday Morning Service",
        );
      });
    });

    it("should close edit dialog when dialog close is triggered", async () => {
      const user = userEvent.setup();
      render(<ServicePage />);

      // Open dialog first
      await waitFor(() => {
        expect(screen.getByTestId("service-card-service-1")).toBeInTheDocument();
      });

      const editButton = screen.getAllByTestId("edit-service")[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-service-dialog")).toBeInTheDocument();
      });

      // Close dialog
      const closeButton = screen.getByTestId("close-dialog");
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("edit-service-dialog")).not.toBeInTheDocument();
      });
    });

    it("should refresh services when edit dialog success is triggered", async () => {
      const user = userEvent.setup();
      render(<ServicePage />);

      // Open dialog first
      await waitFor(() => {
        expect(screen.getByTestId("service-card-service-1")).toBeInTheDocument();
      });

      const editButton = screen.getAllByTestId("edit-service")[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-service-dialog")).toBeInTheDocument();
      });

      // Trigger success
      const successButton = screen.getByTestId("trigger-edit-success");
      await user.click(successButton);

      // Verify getServices was called again (refetch)
      await waitFor(() => {
        expect(serviceCore.getServices).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Service Creation", () => {
    it("should refresh services when create dialog success is triggered", async () => {
      const user = userEvent.setup();
      useTenantRole.mockReturnValue({ role: "owner", isLoading: false });

      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("create-service-dialog")).toBeInTheDocument();
      });

      const successButton = screen.getByTestId("trigger-success");
      await user.click(successButton);

      // Verify getServices was called again (refetch)
      await waitFor(() => {
        expect(serviceCore.getServices).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Service Deletion", () => {
    it("should refresh services when service deletion is triggered", async () => {
      const user = userEvent.setup();
      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("service-card-service-1")).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTestId("trigger-deleted")[0];
      await user.click(deleteButton);

      // Verify getServices was called again (refetch)
      await waitFor(() => {
        expect(serviceCore.getServices).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle tenant loading error gracefully", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockRejectedValue(new Error("Tenant not found"));

      render(<ServicePage />);

      await waitFor(() => {
        // Should still render layout but without tenant name
        expect(screen.getByTestId("tenant-page-layout")).toBeInTheDocument();
        expect(screen.getByTestId("layout-tenant-name")).toHaveTextContent("");
      });
    });

    it("should handle services loading error gracefully", async () => {
      (serviceCore.getServices as jest.Mock).mockRejectedValue(new Error("Services fetch failed"));

      render(<ServicePage />);

      await waitFor(() => {
        // Should show no services message when services fail to load
        expect(screen.getByText("services.noServiceTypesYet")).toBeInTheDocument();
      });
    });

    it("should handle missing slug parameter", () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      render(<ServicePage />);

      // Should not call getTenantBySlug if slug is missing
      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });

    it("should handle missing tenant ID for services fetch", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue({
        ...mockTenant,
        id: undefined,
      });

      render(<ServicePage />);

      await waitFor(() => {
        // Should not call getServices if tenant ID is missing
        expect(serviceCore.getServices).not.toHaveBeenCalled();
      });
    });
  });

  describe("Query Dependencies", () => {
    it("should not fetch tenant when slug is missing", () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      render(<ServicePage />);

      expect(tenantUtils.getTenantBySlug).not.toHaveBeenCalled();
    });

    it("should not fetch services when tenant ID is not available", async () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(null);

      render(<ServicePage />);

      await waitFor(() => {
        expect(serviceCore.getServices).not.toHaveBeenCalled();
      });
    });

    it("should fetch services when tenant is available", async () => {
      render(<ServicePage />);

      await waitFor(() => {
        expect(serviceCore.getServices).toHaveBeenCalledWith("tenant-1");
      });
    });
  });

  describe("User Role Integration", () => {
    it("should pass correct parameters to useTenantRole hook", () => {
      render(<ServicePage />);

      expect(useTenantRole).toHaveBeenCalledWith("test-church", "test-user-id");
    });

    it("should handle missing user ID", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ServicePage />);

      expect(useTenantRole).toHaveBeenCalledWith("test-church", undefined);
    });
  });

  describe("Loading States", () => {
    it("should show loading when session is loading", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<ServicePage />);

      expect(screen.getByTestId("layout-loading")).toHaveTextContent("loading");
    });

    it("should show loading when tenant is loading", () => {
      (tenantUtils.getTenantBySlug as jest.Mock).mockReturnValue(new Promise(() => {}));

      render(<ServicePage />);

      expect(screen.getByTestId("layout-loading")).toHaveTextContent("loading");
    });

    it("should show loading when services are loading", () => {
      (serviceCore.getServices as jest.Mock).mockReturnValue(new Promise(() => {}));

      render(<ServicePage />);

      expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("should not show loading when all data is loaded", async () => {
      render(<ServicePage />);

      await waitFor(() => {
        expect(screen.getByTestId("layout-loading")).toHaveTextContent("not-loading");
        expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
      });
    });
  });
});
