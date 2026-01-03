/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from "@testing-library/react";
import { render, mockUseSessionHelpers } from "../../test-utils";
import ServiceScheduleManagementPage from "@/pages/tenant/ServiceScheduleManagementPage";

// Mock navigation
const mockNavigate = jest.fn();
const mockParams = { slug: "test-church" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
}));

// Mock hooks
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(() => ({ role: "member", isLoading: false })),
}));

// Mock tenant utils
jest.mock("@/lib/tenant-utils", () => ({
  getTenantBySlug: jest.fn(() =>
    Promise.resolve({
      id: "tenant-1",
      name: "Test Church",
      slug: "test-church",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      price_tier_id: null,
    }),
  ),
}));

// Mock services
jest.mock("@/lib/services", () => ({
  getServices: jest.fn(() =>
    Promise.resolve([
      {
        id: "service-1",
        name: "Sunday Service",
        tenant_id: "tenant-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ]),
  ),
}));

// Mock service event queries
jest.mock("@/lib/services/service-event-queries", () => ({
  getServiceEventsWithServices: jest.fn(() => Promise.resolve([])),
}));

// Mock service event CRUD
jest.mock("@/lib/services/service-event-crud", () => ({
  updateServiceEvent: jest.fn(() => Promise.resolve()),
  deleteServiceEvent: jest.fn(() => Promise.resolve()),
}));

// Mock service event owners
jest.mock("@/lib/services/service-event-owners", () => ({
  getServiceEventOwners: jest.fn(() => Promise.resolve([])),
  updateServiceEventOwners: jest.fn(() => Promise.resolve()),
}));

// Mock GenericEventPage component
jest.mock("@/components/shared/GenericEventPage", () => ({
  GenericEventPage: ({
    slug,
    title,
    description,
    calendar,
    filterBar,
    listView,
    actionButton,
  }: any) => (
    <div data-testid="generic-event-page">
      <div data-testid="page-slug">{slug}</div>
      <div data-testid="page-title">{title}</div>
      <div data-testid="page-description">{description}</div>
      <div data-testid="calendar-section">{calendar}</div>
      <div data-testid="filter-bar-section">{filterBar}</div>
      <div data-testid="list-view-section">{listView}</div>
      <div data-testid="action-button-section">{actionButton}</div>
    </div>
  ),
}));

// Mock ServiceScheduleCalendar
jest.mock("@/components/ServiceScheduleManagement/ServiceScheduleCalendar", () => ({
  ServiceScheduleCalendar: ({ schedules, isLoading }: any) => (
    <div data-testid="service-schedule-calendar">
      <div data-testid="calendar-loading">{isLoading ? "loading" : "loaded"}</div>
      <div data-testid="calendar-schedules-count">{schedules?.length || 0}</div>
    </div>
  ),
}));

// Mock ServiceScheduleFilterBar
jest.mock("@/components/ServiceScheduleManagement/ServiceScheduleFilterBar", () => ({
  ServiceScheduleFilterBar: ({ services, selectedServiceId }: any) => (
    <div data-testid="filter-bar">
      <div data-testid="services-count">{services?.length || 0}</div>
      <div data-testid="selected-service">{selectedServiceId}</div>
    </div>
  ),
}));

// Mock ServiceScheduleList
jest.mock("@/components/ServiceScheduleManagement/ServiceScheduleList", () => ({
  ServiceScheduleList: ({ schedules, isLoading, canManage }: any) => (
    <div data-testid="schedule-list">
      <div data-testid="list-loading">{isLoading ? "loading" : "loaded"}</div>
      <div data-testid="list-schedules-count">{schedules?.length || 0}</div>
      <div data-testid="can-manage">{canManage ? "true" : "false"}</div>
    </div>
  ),
}));

// Mock ServiceEventCreateDialog
jest.mock("@/components/ServiceEvents/ServiceEventCreateDialog", () => ({
  ServiceEventCreateDialog: ({ isOpen, tenantId, services }: any) => (
    <div data-testid="create-dialog">
      <div data-testid="dialog-open">{isOpen ? "open" : "closed"}</div>
      <div data-testid="dialog-tenant-id">{tenantId}</div>
      <div data-testid="dialog-services-count">{services?.length || 0}</div>
    </div>
  ),
}));

// Import mocked functions
import { useTenantRole } from "@/hooks/useTenantRole";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { getServices } from "@/lib/services";

const mockUseTenantRole = useTenantRole as jest.MockedFunction<typeof useTenantRole>;
const mockGetTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>;
const mockGetServices = getServices as jest.MockedFunction<typeof getServices>;

describe("ServiceScheduleManagementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSessionHelpers.authenticated();

    // Reset params
    mockParams.slug = "test-church";

    // Setup default mocks
    mockUseTenantRole.mockReturnValue({ role: "member", isLoading: false });
    mockGetTenantBySlug.mockResolvedValue({
      id: "tenant-1",
      name: "Test Church",
      slug: "test-church",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      price_tier_id: null,
    });
    mockGetServices.mockResolvedValue([
      {
        id: "service-1",
        name: "Sunday Service",
        tenant_id: "tenant-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ]);
  });

  it("should render GenericEventPage with correct props", async () => {
    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      expect(screen.getByTestId("page-slug")).toHaveTextContent("test-church");
      expect(screen.getByTestId("page-title")).toHaveTextContent(
        "dashboard:serviceScheduleManagementTitle",
      );
    });
  });

  it("should render calendar section", async () => {
    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("calendar-section")).toBeInTheDocument();
      expect(screen.getByTestId("service-schedule-calendar")).toBeInTheDocument();
    });
  });

  it("should render filter bar with services", async () => {
    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("filter-bar")).toBeInTheDocument();
      expect(screen.getByTestId("services-count")).toHaveTextContent("1");
    });
  });

  it("should render list view section", async () => {
    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("list-view-section")).toBeInTheDocument();
      expect(screen.getByTestId("schedule-list")).toBeInTheDocument();
    });
  });

  it("should show action button when user is tenant owner", async () => {
    mockUseTenantRole.mockReturnValue({ role: "owner", isLoading: false });

    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      const actionButton = screen.queryByTitle("services:createSchedule");
      expect(actionButton).toBeInTheDocument();
    });
  });

  it("should hide action button when user is regular member", async () => {
    mockUseTenantRole.mockReturnValue({ role: "member", isLoading: false });

    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      const actionButton = screen.queryByTitle("services:createSchedule");
      expect(actionButton).not.toBeInTheDocument();
    });
  });

  it("should hide action button when no services exist", async () => {
    mockUseTenantRole.mockReturnValue({ role: "owner", isLoading: false });
    mockGetServices.mockResolvedValue([]);

    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      const actionButton = screen.queryByTitle("services:createSchedule");
      expect(actionButton).not.toBeInTheDocument();
    });
  });

  it("should redirect to auth page when user is not authenticated", () => {
    mockUseSessionHelpers.unauthenticated();

    render(<ServiceScheduleManagementPage />);

    expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
  });

  it("should redirect to not-found when tenant is not found", async () => {
    mockGetTenantBySlug.mockResolvedValue(null);

    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/not-found");
    });
  });

  it("should return null when slug is not provided", () => {
    mockParams.slug = "";

    const { container } = render(<ServiceScheduleManagementPage />);

    expect(container.firstChild).toBeNull();

    // Reset for other tests
    mockParams.slug = "test-church";
  });

  it("should pass canManage correctly to list view", async () => {
    mockUseTenantRole.mockReturnValue({ role: "owner", isLoading: false });

    render(<ServiceScheduleManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("can-manage")).toHaveTextContent("true");
    });
  });
});
