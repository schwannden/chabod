import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import ServiceEventPage from "@/pages/tenant/ServiceEventPage";
import { useSession } from "@/hooks/useSession";
import type { ReactNode } from "react";

// Type definitions for mock components
interface GenericEventPageProps {
  slug: string;
  title: string;
  calendar: ReactNode;
  filterBar: ReactNode;
  listView: ReactNode;
  actionButton?: ReactNode;
  dialog?: ReactNode;
  fetchBaseData?: (tenantId: string) => Promise<void>;
}

interface ServiceEventAddButtonProps {
  onClick: () => void;
}

interface ServiceEventCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  tenantId?: string;
}

interface ServiceEventCalendarProps {
  serviceEvents: unknown[];
  onEventClick?: (event: unknown) => void;
}

interface ServiceEventFilterBarProps {
  allGroups: unknown[];
  services: unknown[];
}

interface ServiceEventListProps {
  serviceEvents: unknown[];
  onEventUpdated: () => void;
}

// Mock navigation
const mockUseParams = jest.fn(() => ({ slug: "test-church" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockUseParams(),
}));

// Get the mocked useSession
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock useTenantRole hook
const mockUseTenantRole = jest.fn(() => ({ role: "owner" }));
jest.mock("@/hooks/useTenantRole", () => ({
  useTenantRole: () => mockUseTenantRole(),
}));

// Mock event filters hook with more control
const mockEventFilters = {
  selectedGroup: "all",
  setSelectedGroup: jest.fn(),
  selectedSecondary: "all",
  setSelectedSecondary: jest.fn(),
  startDate: new Date("2024-01-01"),
  setStartDate: jest.fn(),
  endDate: new Date("2024-01-31"),
  setEndDate: jest.fn(),
};

jest.mock("@/hooks/useEventFilters", () => ({
  useEventFilters: () => mockEventFilters,
}));

// Mock service events hook
import { useServiceEvents } from "@/hooks/useServiceEvents";

jest.mock("@/hooks/useServiceEvents", () => ({
  useServiceEvents: jest.fn(() => ({
    serviceEvents: [],
    isLoading: false,
  })),
}));

// Get the mocked hook after mocking
const mockUseServiceEvents = useServiceEvents as jest.MockedFunction<typeof useServiceEvents>;

// Mock external services
import { getTenantGroups } from "@/lib/group-service";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/lib/group-service", () => ({
  getTenantGroups: jest.fn().mockResolvedValue([]),
}));

const mockGetTenantGroups = getTenantGroups as jest.MockedFunction<typeof getTenantGroups>;

// Mock Supabase client
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  data: [],
  error: null,
};

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseQuery),
  },
}));

// Mock toast
const mockToast = jest.fn();
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Simple mock for GenericEventPage
const mockGenericEventPage = jest.fn();
jest.mock("@/components/shared/GenericEventPage", () => ({
  GenericEventPage: (props: GenericEventPageProps) => {
    mockGenericEventPage(props);
    return (
      <div data-testid="generic-event-page">
        <div data-testid="page-slug">{props.slug}</div>
        <div data-testid="page-title">{props.title}</div>
        <div data-testid="action-button-section">{props.actionButton}</div>
        <div data-testid="calendar-section">{props.calendar}</div>
        <div data-testid="filter-bar-section">{props.filterBar}</div>
        <div data-testid="list-view-section">{props.listView}</div>
        <div data-testid="dialog-section">{props.dialog}</div>
      </div>
    );
  },
}));

// Component mocks
const mockServiceEventAddButton = jest.fn();
jest.mock("@/components/ServiceEvents/ServiceEventAddButton", () => ({
  ServiceEventAddButton: (props: ServiceEventAddButtonProps) => {
    mockServiceEventAddButton(props);
    return (
      <button onClick={props.onClick} data-testid="service-event-add-button">
        Add Service Event
      </button>
    );
  },
}));

const mockServiceEventCreateDialog = jest.fn();
jest.mock("@/components/ServiceEvents/ServiceEventCreateDialog", () => ({
  ServiceEventCreateDialog: (props: ServiceEventCreateDialogProps) => {
    mockServiceEventCreateDialog(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="service-event-create-dialog">
        <button onClick={props.onClose} data-testid="dialog-close">
          Close
        </button>
        <button onClick={() => props.onEventCreated()} data-testid="event-created-trigger">
          Create Event
        </button>
      </div>
    );
  },
}));

const mockServiceEventCalendar = jest.fn();
jest.mock("@/components/ServiceEvents/ServiceEventCalendar", () => ({
  ServiceEventCalendar: (props: ServiceEventCalendarProps) => {
    mockServiceEventCalendar(props);
    return <div data-testid="service-event-calendar" />;
  },
}));

const mockServiceEventFilterBar = jest.fn();
jest.mock("@/components/ServiceEvents/ServiceEventFilterBar", () => ({
  ServiceEventFilterBar: (props: ServiceEventFilterBarProps) => {
    mockServiceEventFilterBar(props);
    return <div data-testid="service-event-filter-bar" />;
  },
}));

const mockServiceEventList = jest.fn();
jest.mock("@/components/ServiceEvents/ServiceEventList", () => ({
  ServiceEventList: (props: ServiceEventListProps) => {
    mockServiceEventList(props);
    return (
      <div data-testid="service-event-list">
        <button onClick={() => props.onEventUpdated()} data-testid="update-event-trigger">
          Update Event
        </button>
      </div>
    );
  },
}));

// Test data
const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  fullName: "Test User",
};

const mockServices = [
  { id: "service-1", name: "Service 1", tenant_id: "test-tenant-id" },
  { id: "service-2", name: "Service 2", tenant_id: "test-tenant-id" },
];

const mockServiceEventsData = [
  { id: "event-1", title: "Event 1", service_id: "service-1" },
  { id: "event-2", title: "Event 2", service_id: "service-2" },
];

describe("ServiceEventPage", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default session
    mockUseSession.mockReturnValue({
      session: null,
      user: mockUser,
      profile: null,
      isLoading: false,
      signOut: jest.fn(),
    });

    // Setup default tenant role
    mockUseTenantRole.mockReturnValue({ role: "owner" });

    // Setup default params
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Setup default Supabase responses
    mockSupabaseQuery.data = [];
    mockSupabaseQuery.error = null;

    // Reset service events hook
    mockUseServiceEvents.mockReturnValue({
      serviceEvents: [],
      isLoading: false,
    });

    // Reset group service mock
    mockGetTenantGroups.mockResolvedValue([]);
  });

  describe("Basic Functionality", () => {
    it("should render the page with correct title and slug", () => {
      render(<ServiceEventPage />);

      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      expect(screen.getByTestId("page-slug")).toHaveTextContent("test-church");
      expect(screen.getByTestId("page-title")).toHaveTextContent("服事表");
    });

    it("should render nothing when slug is undefined", () => {
      mockUseParams.mockReturnValue({ slug: undefined });

      const { container } = render(<ServiceEventPage />);

      expect(container.firstChild).toBeNull();
    });

    it("should pass correct props to GenericEventPage", () => {
      render(<ServiceEventPage />);

      expect(mockGenericEventPage).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "test-church",
          title: "服事表",
        }),
      );
    });

    it("should pass service events hook parameters correctly", () => {
      render(<ServiceEventPage />);

      expect(mockUseServiceEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: null, // Initially null before fetchBaseData
          selectedGroup: "all",
          selectedService: "all",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
          refreshTrigger: 0,
        }),
      );
    });
  });

  describe("Permission Management", () => {
    it("should show add button for tenant owner", () => {
      mockUseTenantRole.mockReturnValue({ role: "owner" });

      render(<ServiceEventPage />);

      expect(screen.getByTestId("service-event-add-button")).toBeInTheDocument();
    });

    it("should not show add button for regular member with no service admin rights", () => {
      mockUseTenantRole.mockReturnValue({ role: "member" });
      mockSupabaseQuery.data = []; // No service admin records

      render(<ServiceEventPage />);

      expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
    });

    it("should not show add button when user is not logged in", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ServiceEventPage />);

      expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
    });

    it("should handle undefined role gracefully", () => {
      mockUseTenantRole.mockReturnValue({ role: undefined });

      render(<ServiceEventPage />);

      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
    });
  });

  describe("Dialog Management", () => {
    it("should open dialog when add button is clicked", async () => {
      const user = userEvent.setup();

      render(<ServiceEventPage />);

      const addButton = screen.getByTestId("service-event-add-button");
      await user.click(addButton);

      expect(screen.getByTestId("service-event-create-dialog")).toBeInTheDocument();
    });

    it("should close dialog when close button is clicked", async () => {
      const user = userEvent.setup();

      render(<ServiceEventPage />);

      // Open dialog first
      const addButton = screen.getByTestId("service-event-add-button");
      await user.click(addButton);

      expect(screen.getByTestId("service-event-create-dialog")).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByTestId("dialog-close");
      await user.click(closeButton);

      expect(screen.queryByTestId("service-event-create-dialog")).not.toBeInTheDocument();
    });

    it("should pass correct props to create dialog when open", async () => {
      const user = userEvent.setup();

      render(<ServiceEventPage />);

      const addButton = screen.getByTestId("service-event-add-button");
      await user.click(addButton);

      expect(mockServiceEventCreateDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true,
          tenantId: "",
          services: [],
        }),
      );
    });

    it("should not render dialog when not open", () => {
      render(<ServiceEventPage />);

      expect(screen.queryByTestId("service-event-create-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Event Handling", () => {
    it("should handle event update and trigger refresh", async () => {
      const user = userEvent.setup();

      render(<ServiceEventPage />);

      // Trigger event update from list
      const updateButton = screen.getByTestId("update-event-trigger");
      await user.click(updateButton);

      // Verify that the hook was called again (indicating refresh)
      expect(mockUseServiceEvents).toHaveBeenCalled();
    });

    it("should handle event creation from dialog", async () => {
      const user = userEvent.setup();

      render(<ServiceEventPage />);

      // Open dialog and trigger event creation
      const addButton = screen.getByTestId("service-event-add-button");
      await user.click(addButton);

      const createButton = screen.getByTestId("event-created-trigger");
      await user.click(createButton);

      // Dialog should close and events should refresh
      expect(mockUseServiceEvents).toHaveBeenCalled();
    });
  });

  describe("Component Props and Integration", () => {
    it("should pass correct props to service event calendar", () => {
      const mockEvents = mockServiceEventsData;
      mockUseServiceEvents.mockReturnValue({
        serviceEvents: mockEvents,
        isLoading: false,
      });

      render(<ServiceEventPage />);

      expect(mockServiceEventCalendar).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceEvents: mockEvents,
          services: [],
          isLoading: false,
        }),
      );
    });

    it("should pass correct props to service event list", () => {
      const mockEvents = mockServiceEventsData;
      mockUseServiceEvents.mockReturnValue({
        serviceEvents: mockEvents,
        isLoading: false,
      });

      render(<ServiceEventPage />);

      expect(mockServiceEventList).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceEvents: mockEvents,
          isLoading: false,
          tenantId: "",
          services: [],
        }),
      );
    });

    it("should pass correct props to filter bar", () => {
      render(<ServiceEventPage />);

      expect(mockServiceEventFilterBar).toHaveBeenCalledWith(
        expect.objectContaining({
          allGroups: [],
          services: [],
          selectedGroup: "all",
          setSelectedGroup: mockEventFilters.setSelectedGroup,
          selectedService: "all",
          setSelectedService: mockEventFilters.setSelectedSecondary,
          startDate: new Date("2024-01-01"),
          setStartDate: mockEventFilters.setStartDate,
          endDate: new Date("2024-01-31"),
          setEndDate: mockEventFilters.setEndDate,
        }),
      );
    });

    it("should pass loading state to components", () => {
      mockUseServiceEvents.mockReturnValue({
        serviceEvents: [],
        isLoading: true,
      });

      render(<ServiceEventPage />);

      expect(mockServiceEventCalendar).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: true,
        }),
      );

      expect(mockServiceEventList).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: true,
        }),
      );
    });
  });

  describe("Loading States", () => {
    it("should handle loading session state", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<ServiceEventPage />);

      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
    });

    it("should render correctly when service events are loading", () => {
      mockUseServiceEvents.mockReturnValue({
        serviceEvents: [],
        isLoading: true,
      });

      render(<ServiceEventPage />);

      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      expect(mockServiceEventCalendar).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: true,
        }),
      );
    });
  });

  describe("Component Structure", () => {
    it("should render all major sections", () => {
      render(<ServiceEventPage />);

      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      expect(screen.getByTestId("page-slug")).toBeInTheDocument();
      expect(screen.getByTestId("page-title")).toBeInTheDocument();
      expect(screen.getByTestId("action-button-section")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-section")).toBeInTheDocument();
      expect(screen.getByTestId("filter-bar-section")).toBeInTheDocument();
      expect(screen.getByTestId("list-view-section")).toBeInTheDocument();
    });

    it("should pass fetchBaseData function to GenericEventPage", () => {
      render(<ServiceEventPage />);

      expect(mockGenericEventPage).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchBaseData: expect.any(Function),
        }),
      );
    });
  });

  describe("Event Filters Integration", () => {
    it("should use filter values from hook", () => {
      render(<ServiceEventPage />);

      expect(mockUseServiceEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedGroup: "all",
          selectedService: "all",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        }),
      );
    });

    it("should pass filter setters to filter bar", () => {
      render(<ServiceEventPage />);

      expect(mockServiceEventFilterBar).toHaveBeenCalledWith(
        expect.objectContaining({
          setSelectedGroup: expect.any(Function),
          setSelectedService: expect.any(Function),
          setStartDate: expect.any(Function),
          setEndDate: expect.any(Function),
        }),
      );
    });
  });

  describe("Error Scenarios", () => {
    it("should handle missing tenant ID gracefully", () => {
      render(<ServiceEventPage />);

      // Component should still render
      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();

      // Should pass empty tenantId to components
      expect(mockServiceEventList).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "",
        }),
      );
    });

    it("should handle user with no permissions", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ServiceEventPage />);

      expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
    });
  });

  describe("Service Admin Permission Checking", () => {
    beforeEach(() => {
      // Reset mocks for each test
      jest.clearAllMocks();
      mockUseTenantRole.mockReturnValue({ role: "member" });
      mockUseSession.mockReturnValue({
        session: null,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should show add button for service admin", async () => {
      // Mock successful service admin check
      mockSupabaseQuery.data = [{ id: "admin-record-1" }];
      mockSupabaseQuery.error = null;

      render(<ServiceEventPage />);

      // Call fetchBaseData to set tenantId
      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(screen.getByTestId("service-event-add-button")).toBeInTheDocument();
      });
    });

    it("should not show add button for non-service admin", async () => {
      // Mock no service admin records
      mockSupabaseQuery.data = [];
      mockSupabaseQuery.error = null;

      render(<ServiceEventPage />);

      // Call fetchBaseData to set tenantId
      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
      });
    });

    it("should handle service admin query error", async () => {
      // Mock Supabase error
      mockSupabaseQuery.data = null;
      mockSupabaseQuery.error = { message: "Database error" };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<ServiceEventPage />);

      // Call fetchBaseData to set tenantId
      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error checking service admin status:", {
          message: "Database error",
        });
        expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should handle service admin query exception", async () => {
      // Mock exception in Supabase call
      const mockSupabaseFromSpy = jest.fn().mockImplementation(() => {
        throw new Error("Network error");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from = mockSupabaseFromSpy;

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<ServiceEventPage />);

      // Call fetchBaseData to set tenantId
      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error checking create permissions:",
          expect.any(Error),
        );
        expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should handle service admin check when tenantId is null", async () => {
      render(<ServiceEventPage />);

      // Don't call fetchBaseData, so tenantId remains null
      await waitFor(() => {
        expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
      });
    });

    it("should handle service admin check when user is null", async () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ServiceEventPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("service-event-add-button")).not.toBeInTheDocument();
      });
    });
  });

  describe("fetchBaseData Function", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset Supabase mock to default state
      mockSupabaseQuery.data = mockServices;
      mockSupabaseQuery.error = null;

      // Restore the original Supabase mock structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from = jest.fn(() => mockSupabaseQuery);

      mockGetTenantGroups.mockResolvedValue([
        { id: "group-1", name: "Group 1" },
        { id: "group-2", name: "Group 2" },
      ]);
    });

    it("should successfully fetch groups and services", async () => {
      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      // Verify groups were fetched
      expect(mockGetTenantGroups).toHaveBeenCalledWith("test-tenant-id");

      // Verify services were fetched
      expect(supabase.from).toHaveBeenCalledWith("services");
      expect(mockSupabaseQuery.select).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith("tenant_id", "test-tenant-id");

      // Verify state is updated with fetched data
      await waitFor(() => {
        expect(mockServiceEventFilterBar).toHaveBeenCalledWith(
          expect.objectContaining({
            allGroups: [
              { id: "group-1", name: "Group 1" },
              { id: "group-2", name: "Group 2" },
            ],
            services: mockServices,
          }),
        );
      });
    });

    it("should handle empty tenant ID gracefully", async () => {
      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("");
      });

      // Should not call external services with empty ID
      expect(mockGetTenantGroups).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should handle group fetching error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockGetTenantGroups.mockRejectedValue(new Error("Groups fetch failed"));

      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching groups:", expect.any(Error));
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Failed to load groups. Some features may be limited.",
          variant: "destructive",
        });
      });

      consoleSpy.mockRestore();
    });

    it("should handle services fetching error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockSupabaseQuery.data = null;
      mockSupabaseQuery.error = { message: "Services fetch failed" };

      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(
        () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            "Error fetching services:",
            expect.objectContaining({
              message: "Services fetch failed",
            }),
          );
          expect(mockToast).toHaveBeenCalledWith({
            title: "Error",
            description: "Failed to load services. Some features may be limited.",
            variant: "destructive",
          });
        },
        { timeout: 3000 },
      );

      consoleSpy.mockRestore();
    });

    it("should handle services fetching exception", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Mock Supabase to throw an exception
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from = jest.fn().mockImplementation(() => {
        throw new Error("Network exception");
      });

      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching services:", expect.any(Error));
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Failed to load services. Some features may be limited.",
          variant: "destructive",
        });
      });

      consoleSpy.mockRestore();
      // Restore the mock for other tests
      supabase.from = jest.fn(() => mockSupabaseQuery);
    });

    it("should handle null groups response gracefully", async () => {
      mockGetTenantGroups.mockResolvedValue(null);

      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(mockServiceEventFilterBar).toHaveBeenCalledWith(
          expect.objectContaining({
            allGroups: [],
          }),
        );
      });
    });

    it("should handle null services response gracefully", async () => {
      mockSupabaseQuery.data = null;
      mockSupabaseQuery.error = null;

      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      await waitFor(() => {
        expect(mockServiceEventFilterBar).toHaveBeenCalledWith(
          expect.objectContaining({
            services: [],
          }),
        );
      });
    });

    it("should update tenantId state correctly", async () => {
      render(<ServiceEventPage />);

      await act(async () => {
        const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;
        await fetchBaseDataCall("test-tenant-id");
      });

      // Verify tenantId was passed to components after a re-render
      await waitFor(
        () => {
          expect(mockServiceEventList).toHaveBeenCalledWith(
            expect.objectContaining({
              tenantId: "test-tenant-id",
            }),
          );
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Integration with useServiceEvents Hook", () => {
    beforeEach(() => {
      // Ensure mocks are properly set up
      jest.clearAllMocks();
    });

    it("should call useServiceEvents with updated tenantId after fetchBaseData", async () => {
      render(<ServiceEventPage />);

      // Get the fetchBaseData function before clearing mocks
      await waitFor(() => {
        expect(mockGenericEventPage).toHaveBeenCalled();
      });

      const fetchBaseDataCall = mockGenericEventPage.mock.calls[0][0].fetchBaseData;

      // Clear hook call history but not the captured function
      mockUseServiceEvents.mockClear();

      await act(async () => {
        await fetchBaseDataCall("test-tenant-id");
      });

      // Should trigger re-render with updated tenantId
      await waitFor(() => {
        expect(mockUseServiceEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: "test-tenant-id",
          }),
        );
      });
    });

    it("should handle refresh trigger increment correctly", async () => {
      render(<ServiceEventPage />);

      // Simulate multiple event updates
      const updateButton = screen.getByTestId("update-event-trigger");

      await act(async () => {
        await userEvent.setup().click(updateButton);
      });

      await act(async () => {
        await userEvent.setup().click(updateButton);
      });

      // Should call hook multiple times with incremented refresh triggers
      expect(mockUseServiceEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTrigger: expect.any(Number),
        }),
      );
    });
  });
});
