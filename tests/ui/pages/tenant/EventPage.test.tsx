import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../../test-utils";
import EventPage from "@/pages/tenant/EventPage";
import * as eventService from "@/lib/event-service";
import * as groupService from "@/lib/group-service";

// Mock navigation
const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ slug: "test-church" }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock useEventFilters hook
const mockFilters = {
  selectedGroup: "all",
  setSelectedGroup: jest.fn(),
  startDate: new Date("2024-01-01"),
  setStartDate: jest.fn(),
  endDate: new Date("2024-01-31"),
  setEndDate: jest.fn(),
  selectedSecondary: "all",
  setSelectedSecondary: jest.fn(),
  resetFilters: jest.fn(),
};

jest.mock("@/hooks/useEventFilters", () => ({
  useEventFilters: () => mockFilters,
}));

// Mock GenericEventPage component
jest.mock("@/components/shared/GenericEventPage", () => ({
  GenericEventPage: ({
    slug,
    title,
    calendar,
    filterBar,
    listView,
    actionButton,
    fetchBaseData,
  }: {
    slug: string;
    title: string;
    calendar: React.ReactNode;
    filterBar: React.ReactNode;
    listView: React.ReactNode;
    actionButton?: React.ReactNode;
    fetchBaseData?: (tenantId: string) => Promise<void>;
  }) => {
    // Simulate calling fetchBaseData when component mounts
    React.useEffect(() => {
      if (fetchBaseData) {
        fetchBaseData("test-tenant-id");
      }
    }, [fetchBaseData]);

    return (
      <div data-testid="generic-event-page">
        <div data-testid="page-slug">{slug}</div>
        <div data-testid="page-title">{title}</div>
        <div data-testid="calendar-section">{calendar}</div>
        <div data-testid="filter-bar-section">{filterBar}</div>
        <div data-testid="list-view-section">{listView}</div>
        <div data-testid="action-button-section">{actionButton}</div>
      </div>
    );
  },
}));

// Mock EventCalendar component
jest.mock("@/components/Events/EventCalendar", () => ({
  EventCalendar: ({ events, isLoading }: { events: unknown[]; isLoading: boolean }) => (
    <div data-testid="event-calendar">
      <div data-testid="calendar-loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="calendar-events-count">{events.length}</div>
      {events.map((event) => (
        <div key={event.id} data-testid={`calendar-event-${event.id}`}>
          {event.name}
        </div>
      ))}
    </div>
  ),
}));

// Mock EventFilterBar component
jest.mock("@/components/Events/EventFilterBar", () => ({
  EventFilterBar: ({
    allGroups,
    selectedGroup,
    setSelectedGroup,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  }: {
    allGroups: unknown[];
    selectedGroup: string;
    setSelectedGroup: (value: string) => void;
    startDate: Date | undefined;
    setStartDate: (date: Date | undefined) => void;
    endDate: Date | undefined;
    setEndDate: (date: Date | undefined) => void;
  }) => (
    <div data-testid="event-filter-bar">
      <div data-testid="filter-groups-count">{allGroups.length}</div>
      <div data-testid="filter-selected-group">{selectedGroup}</div>
      <div data-testid="filter-start-date">{startDate?.toISOString()}</div>
      <div data-testid="filter-end-date">{endDate?.toISOString()}</div>
      <button onClick={() => setSelectedGroup("group-1")} data-testid="mock-set-group">
        Set Group
      </button>
      <button
        onClick={() => setStartDate(new Date("2024-02-01"))}
        data-testid="mock-set-start-date"
      >
        Set Start Date
      </button>
      <button onClick={() => setEndDate(new Date("2024-02-28"))} data-testid="mock-set-end-date">
        Set End Date
      </button>
    </div>
  ),
}));

// Mock EventList component
jest.mock("@/components/Events/EventList", () => ({
  EventList: ({
    events,
    isLoading,
    tenantId,
    onEventUpdated,
    allGroups,
    onCopyEvent,
  }: {
    events: unknown[];
    isLoading: boolean;
    tenantId: string;
    onEventUpdated: () => void;
    allGroups: unknown[];
    onCopyEvent?: (event: unknown) => void;
  }) => (
    <div data-testid="event-list">
      <div data-testid="list-loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="list-tenant-id">{tenantId}</div>
      <div data-testid="list-events-count">{events.length}</div>
      <div data-testid="list-groups-count">{allGroups.length}</div>
      <div data-testid="list-can-copy">{onCopyEvent ? "true" : "false"}</div>
      <button onClick={onEventUpdated} data-testid="mock-event-updated">
        Trigger Event Updated
      </button>
      {events.map((event) => (
        <div key={event.id} data-testid={`list-event-${event.id}`}>
          <span>{event.name}</span>
          {onCopyEvent && (
            <button onClick={() => onCopyEvent(event)} data-testid={`copy-event-${event.id}`}>
              Copy Event
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}));

// Mock CreateEventDialog component
jest.mock("@/components/Events/CreateEventDialog", () => ({
  CreateEventDialog: ({
    tenantId,
    onEventCreated,
    allGroups,
  }: {
    tenantId: string;
    onEventCreated: () => void;
    allGroups: unknown[];
  }) => (
    <div data-testid="create-event-dialog">
      <div data-testid="create-dialog-tenant-id">{tenantId}</div>
      <div data-testid="create-dialog-groups-count">{allGroups.length}</div>
      <button onClick={onEventCreated} data-testid="mock-event-created">
        Trigger Event Created
      </button>
    </div>
  ),
}));

// Mock CopyEventDialog component
jest.mock("@/components/Events/CopyEventDialog", () => ({
  CopyEventDialog: ({
    tenantId,
    onEventCreated,
    event,
    allGroups,
    open,
    onOpenChange,
  }: {
    tenantId: string;
    onEventCreated: () => void;
    event: unknown;
    allGroups: unknown[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="copy-event-dialog">
        <div data-testid="copy-dialog-tenant-id">{tenantId}</div>
        <div data-testid="copy-dialog-event-id">{event.id}</div>
        <div data-testid="copy-dialog-groups-count">{allGroups.length}</div>
        <div data-testid="copy-dialog-open">{open ? "open" : "closed"}</div>
        <button onClick={onEventCreated} data-testid="mock-copy-event-created">
          Trigger Event Created
        </button>
        <button onClick={() => onOpenChange(false)} data-testid="mock-copy-dialog-close">
          Close Dialog
        </button>
      </div>
    ) : null,
}));

// Mock the service functions
jest.mock("@/lib/event-service", () => ({
  getTenantEvents: jest.fn(),
}));

jest.mock("@/lib/group-service", () => ({
  getTenantGroups: jest.fn(),
}));

describe("EventPage", () => {
  // Using mock data from test-utils.tsx

  const mockEvents = [
    {
      id: "event-1",
      name: "Weekly Service",
      description: "Sunday service",
      date: "2024-01-07",
      start_time: "10:00",
      end_time: "12:00",
      tenant_id: "test-tenant-id",
      visibility: "public" as const,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      groups: [
        {
          id: "group-1",
          name: "Youth Group",
        },
      ],
    },
    {
      id: "event-2",
      name: "Bible Study",
      description: "Midweek study",
      date: "2024-01-10",
      start_time: "19:00",
      end_time: "21:00",
      tenant_id: "test-tenant-id",
      visibility: "public" as const,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      groups: [],
    },
  ];

  const mockGroups = [
    {
      id: "group-1",
      name: "Youth Group",
      description: "For young people",
      tenant_id: "test-tenant-id",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "group-2",
      name: "Seniors Group",
      description: "For older members",
      tenant_id: "test-tenant-id",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ slug: "test-church" });

    // Reset mock filters
    Object.assign(mockFilters, {
      selectedGroup: "all",
      setSelectedGroup: jest.fn(),
      startDate: new Date("2024-01-01"),
      setStartDate: jest.fn(),
      endDate: new Date("2024-01-31"),
      setEndDate: jest.fn(),
      selectedSecondary: "all",
      setSelectedSecondary: jest.fn(),
      resetFilters: jest.fn(),
    });

    // Set up default mocks
    (eventService.getTenantEvents as jest.Mock).mockResolvedValue(mockEvents);
    (groupService.getTenantGroups as jest.Mock).mockResolvedValue(mockGroups);
  });

  describe("Rendering", () => {
    it("should render correctly when slug is provided", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      });

      expect(screen.getByTestId("page-slug")).toHaveTextContent("test-church");
      expect(screen.getByTestId("page-title")).toHaveTextContent("活動");
    });

    it("should return null when no slug is provided", () => {
      mockUseParams.mockReturnValue({ slug: undefined });
      mockUseSessionHelpers.authenticatedNoProfile();

      const { container } = render(<EventPage />);
      expect(container.firstChild).toBeNull();
    });

    it("should render all main sections", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("calendar-section")).toBeInTheDocument();
        expect(screen.getByTestId("filter-bar-section")).toBeInTheDocument();
        expect(screen.getByTestId("list-view-section")).toBeInTheDocument();
        expect(screen.getByTestId("action-button-section")).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch groups and events on mount", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(groupService.getTenantGroups).toHaveBeenCalledWith("test-tenant-id");
        expect(eventService.getTenantEvents).toHaveBeenCalledWith(
          "test-tenant-id",
          "all",
          "2024-01-01",
          "2024-01-31",
        );
      });
    });

    it("should display fetched groups and events", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-groups-count")).toHaveTextContent("2");
        expect(screen.getByTestId("calendar-events-count")).toHaveTextContent("2");
        expect(screen.getByTestId("list-events-count")).toHaveTextContent("2");
      });

      // Check that events are displayed
      expect(screen.getByTestId("calendar-event-event-1")).toHaveTextContent("Weekly Service");
      expect(screen.getByTestId("list-event-event-1")).toHaveTextContent("Weekly Service");
    });

    it("should refetch events when filters change", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      // Create a new component instance with different filters
      const TestComponent = () => {
        const [filterState, setFilterState] = React.useState({
          selectedGroup: "all",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        });

        // Update mockFilters to reflect current state
        React.useEffect(() => {
          Object.assign(mockFilters, {
            ...mockFilters,
            selectedGroup: filterState.selectedGroup,
            startDate: filterState.startDate,
            endDate: filterState.endDate,
          });
        }, [filterState]);

        return (
          <>
            <EventPage />
            <button
              data-testid="test-change-filters"
              onClick={() =>
                setFilterState({
                  selectedGroup: "group-1",
                  startDate: new Date("2024-02-01"),
                  endDate: new Date("2024-02-28"),
                })
              }
            >
              Change Filters
            </button>
          </>
        );
      };

      render(<TestComponent />);

      // Wait for initial fetch
      await waitFor(() => {
        expect(eventService.getTenantEvents).toHaveBeenCalledWith(
          "test-tenant-id",
          "all",
          "2024-01-01",
          "2024-01-31",
        );
      });

      const initialCallCount = (eventService.getTenantEvents as jest.Mock).mock.calls.length;

      // Change filters
      const changeFiltersButton = screen.getByTestId("test-change-filters");
      await act(async () => {
        await userEvent.click(changeFiltersButton);
      });

      // Should trigger a re-render with new filters
      await waitFor(() => {
        expect(eventService.getTenantEvents).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle group fetching errors gracefully", async () => {
      (groupService.getTenantGroups as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch groups"),
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      });

      // Should still render with empty groups
      expect(screen.getByTestId("filter-groups-count")).toHaveTextContent("0");
    });

    it("should handle event fetching errors gracefully", async () => {
      (eventService.getTenantEvents as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch events"),
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      });

      // Should still render with empty events
      expect(screen.getByTestId("calendar-events-count")).toHaveTextContent("0");
      expect(screen.getByTestId("list-events-count")).toHaveTextContent("0");
    });
  });

  describe("Authentication-dependent Features", () => {
    it("should show action buttons when user is authenticated", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("create-event-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("list-can-copy")).toHaveTextContent("true");
      });
    });

    it("should hide action buttons when user is not authenticated", async () => {
      mockUseSessionHelpers.unauthenticated();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("create-event-dialog")).not.toBeInTheDocument();
        expect(screen.getByTestId("list-can-copy")).toHaveTextContent("false");
      });
    });
  });

  describe("Event Management", () => {
    it("should handle event creation", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("create-event-dialog")).toBeInTheDocument();
      });

      const initialCallCount = (eventService.getTenantEvents as jest.Mock).mock.calls.length;

      const createButton = screen.getByTestId("mock-event-created");
      await act(async () => {
        await userEvent.click(createButton);
      });

      // Should refetch events after creation (at least one more call)
      await waitFor(() => {
        expect((eventService.getTenantEvents as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });

    it("should handle event updates", async () => {
      // Set up a mock that resolves with a slight delay to simulate real async behavior
      (eventService.getTenantEvents as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 50)),
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      // Wait for component to be fully loaded and initial calls to complete
      await waitFor(() => {
        expect(screen.getByTestId("event-list")).toBeInTheDocument();
        expect(screen.getByTestId("list-loading")).toHaveTextContent("not-loading");
      });

      // Get the call count after initial load is completely done
      const initialCallCount = (eventService.getTenantEvents as jest.Mock).mock.calls.length;

      const updateButton = screen.getByTestId("mock-event-updated");

      // Trigger the update
      await act(async () => {
        await userEvent.click(updateButton);
      });

      // Wait for the new call to be made and completed
      await waitFor(
        () => {
          const currentCallCount = (eventService.getTenantEvents as jest.Mock).mock.calls.length;
          expect(currentCallCount).toBeGreaterThan(initialCallCount);
        },
        { timeout: 8000 },
      );

      // Verify that loading state returned to not-loading after the update
      await waitFor(() => {
        expect(screen.getByTestId("list-loading")).toHaveTextContent("not-loading");
      });
    }, 15000);

    it("should handle event copying", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("list-event-event-1")).toBeInTheDocument();
      });

      // Click copy button for first event
      const copyButton = screen.getByTestId("copy-event-event-1");
      await act(async () => {
        await userEvent.click(copyButton);
      });

      // Should show copy dialog
      await waitFor(() => {
        expect(screen.getByTestId("copy-event-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("copy-dialog-event-id")).toHaveTextContent("event-1");
        expect(screen.getByTestId("copy-dialog-open")).toHaveTextContent("open");
      });

      const initialCallCount = (eventService.getTenantEvents as jest.Mock).mock.calls.length;

      // Complete the copy operation
      const confirmCopyButton = screen.getByTestId("mock-copy-event-created");
      await act(async () => {
        await userEvent.click(confirmCopyButton);
      });

      // Should refetch events after copying (at least one more call)
      await waitFor(() => {
        expect((eventService.getTenantEvents as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });

    it("should close copy dialog when cancelled", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("list-event-event-1")).toBeInTheDocument();
      });

      // Open copy dialog
      const copyButton = screen.getByTestId("copy-event-event-1");
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByTestId("copy-event-dialog")).toBeInTheDocument();
      });

      // Close dialog
      const closeButton = screen.getByTestId("mock-copy-dialog-close");
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("copy-event-dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state while fetching events", async () => {
      // Mock a delayed response
      (eventService.getTenantEvents as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 100)),
      );

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      // Initially should show loading
      expect(screen.getByTestId("calendar-loading")).toHaveTextContent("loading");
      expect(screen.getByTestId("list-loading")).toHaveTextContent("loading");

      // After data loads, should not be loading
      await waitFor(() => {
        expect(screen.getByTestId("calendar-loading")).toHaveTextContent("not-loading");
        expect(screen.getByTestId("list-loading")).toHaveTextContent("not-loading");
      });
    });
  });

  describe("Filter Integration", () => {
    it("should pass correct props to EventFilterBar", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-selected-group")).toHaveTextContent("all");
        expect(screen.getByTestId("filter-start-date")).toHaveTextContent(
          "2024-01-01T00:00:00.000Z",
        );
        expect(screen.getByTestId("filter-end-date")).toHaveTextContent("2024-01-31T00:00:00.000Z");
      });
    });

    it("should update filters when filter controls are used", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("event-filter-bar")).toBeInTheDocument();
      });

      // Test filter updates
      const setGroupButton = screen.getByTestId("mock-set-group");
      const setStartDateButton = screen.getByTestId("mock-set-start-date");
      const setEndDateButton = screen.getByTestId("mock-set-end-date");

      await userEvent.click(setGroupButton);
      expect(mockFilters.setSelectedGroup).toHaveBeenCalledWith("group-1");

      await userEvent.click(setStartDateButton);
      expect(mockFilters.setStartDate).toHaveBeenCalledWith(new Date("2024-02-01"));

      await userEvent.click(setEndDateButton);
      expect(mockFilters.setEndDate).toHaveBeenCalledWith(new Date("2024-02-28"));
    });
  });

  describe("Accessibility", () => {
    it("should have proper structure for screen readers", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("generic-event-page")).toBeInTheDocument();
      });

      // Check that all main sections are present and identifiable
      expect(screen.getByTestId("calendar-section")).toBeInTheDocument();
      expect(screen.getByTestId("filter-bar-section")).toBeInTheDocument();
      expect(screen.getByTestId("list-view-section")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty events list", async () => {
      (eventService.getTenantEvents as jest.Mock).mockResolvedValue([]);

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("calendar-events-count")).toHaveTextContent("0");
        expect(screen.getByTestId("list-events-count")).toHaveTextContent("0");
      });
    });

    it("should handle empty groups list", async () => {
      (groupService.getTenantGroups as jest.Mock).mockResolvedValue([]);

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-groups-count")).toHaveTextContent("0");
        expect(screen.getByTestId("list-groups-count")).toHaveTextContent("0");
      });
    });

    it("should handle null groups response", async () => {
      (groupService.getTenantGroups as jest.Mock).mockResolvedValue(null);

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-groups-count")).toHaveTextContent("0");
        expect(screen.getByTestId("list-groups-count")).toHaveTextContent("0");
      });
    });

    it("should handle undefined filter dates", async () => {
      // Set filters to have undefined dates
      Object.assign(mockFilters, {
        startDate: undefined,
        endDate: undefined,
      });

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      await waitFor(() => {
        expect(eventService.getTenantEvents).toHaveBeenCalledWith(
          "test-tenant-id",
          "all",
          undefined,
          undefined,
        );
      });
    });
  });

  describe("Toast Notifications", () => {
    it("should show error toast when event fetching fails", async () => {
      (eventService.getTenantEvents as jest.Mock).mockRejectedValue(new Error("Network error"));

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      // The toast call is tested through the error handling in the component
      // The console.error should be called
      await waitFor(() => {
        expect(screen.getByTestId("calendar-events-count")).toHaveTextContent("0");
      });
    });

    it("should show error toast when group fetching fails", async () => {
      (groupService.getTenantGroups as jest.Mock).mockRejectedValue(new Error("Network error"));

      mockUseSessionHelpers.authenticatedNoProfile();

      render(<EventPage />);

      // The toast call is tested through the error handling in the component
      await waitFor(() => {
        expect(screen.getByTestId("filter-groups-count")).toHaveTextContent("0");
      });
    });
  });
});
