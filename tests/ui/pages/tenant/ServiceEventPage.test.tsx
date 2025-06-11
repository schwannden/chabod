/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen } from "@testing-library/react";
import { render, mockUseSessionHelpers } from "../../test-utils";
import ServiceEventPage from "@/pages/tenant/ServiceEventPage";

// Mock navigation
const mockParams = { slug: "test-church" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockParams,
  useNavigate: () => jest.fn(),
}));

// Mock hooks with proper return types
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: jest.fn(() => ({ role: "member", isLoading: false })),
}));

jest.mock("@/hooks/useEventFilters", () => ({
  useEventFilters: jest.fn(() => ({
    selectedGroup: "all",
    setSelectedGroup: jest.fn(),
    selectedSecondary: "all",
    setSelectedSecondary: jest.fn(),
    startDate: new Date(),
    setStartDate: jest.fn(),
    endDate: new Date(),
    setEndDate: jest.fn(),
    resetFilters: jest.fn(),
  })),
}));

jest.mock("@/hooks/useServiceEvents", () => ({
  useServiceEvents: jest.fn(() => ({
    serviceEvents: [],
    isLoading: false,
  })),
}));

// Mock service functions
jest.mock("@/lib/group-service", () => ({
  getTenantGroups: jest.fn(() => Promise.resolve([])),
}));

// Mock supabase
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      data: [],
      error: null,
    })),
  },
}));

// Mock components
jest.mock("@/components/shared/GenericEventPage", () => ({
  GenericEventPage: ({ actionButton, title, slug, description }: any) => (
    <div data-testid="generic-event-page">
      <div data-testid="page-title">{title}</div>
      <div data-testid="page-slug">{slug}</div>
      <div data-testid="page-description">{description}</div>
      <div data-testid="action-button-section">{actionButton}</div>
    </div>
  ),
}));

jest.mock("@/components/ServiceEvents/ServiceEventCalendar", () => ({
  ServiceEventCalendar: () => <div data-testid="service-event-calendar">Calendar</div>,
}));

jest.mock("@/components/ServiceEvents/ServiceEventFilterBar", () => ({
  ServiceEventFilterBar: () => <div data-testid="service-event-filter-bar">Filter Bar</div>,
}));

jest.mock("@/components/ServiceEvents/ServiceEventList", () => ({
  ServiceEventList: () => <div data-testid="service-event-list">List</div>,
}));

jest.mock("@/components/ServiceEvents/ServiceEventCreateDialog", () => ({
  ServiceEventCreateDialog: () => (
    <button data-testid="service-event-create-button">Create Service Event</button>
  ),
}));

// Import mocked functions
import { useTenantRole } from "@/hooks/useTenantRole";

const mockUseTenantRole = useTenantRole as jest.MockedFunction<typeof useTenantRole>;

describe("ServiceEventPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks to defaults
    mockUseTenantRole.mockReturnValue({ role: "member", isLoading: false });
    mockUseSessionHelpers.authenticated();
  });

  it("should render all main components", () => {
    render(<ServiceEventPage />);

    expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
    expect(screen.getByTestId("page-title")).toHaveTextContent("dashboard:serviceEventTitle");
    expect(screen.getByTestId("page-slug")).toHaveTextContent("test-church");
  });

  it("should show create button for tenant owners", () => {
    mockUseTenantRole.mockReturnValue({ role: "owner", isLoading: false });

    render(<ServiceEventPage />);

    expect(screen.getByTestId("service-event-create-button")).toBeInTheDocument();
  });

  it("should not show create button for regular members", () => {
    mockUseTenantRole.mockReturnValue({ role: "member", isLoading: false });

    render(<ServiceEventPage />);

    expect(screen.queryByTestId("service-event-create-button")).not.toBeInTheDocument();
  });

  it("should not show create button when user is not logged in", () => {
    mockUseSessionHelpers.unauthenticated();

    render(<ServiceEventPage />);

    expect(screen.queryByTestId("service-event-create-button")).not.toBeInTheDocument();
  });

  it("should return null when slug is not provided", () => {
    mockParams.slug = "";

    const { container } = render(<ServiceEventPage />);

    expect(container.firstChild).toBeNull();

    // Reset for other tests
    mockParams.slug = "test-church";
  });
});
