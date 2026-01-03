import React from "react";
import { screen } from "@testing-library/react";
import { render } from "../../test-utils";
import { EventCard } from "@/components/Events/EventCard";
import { EventWithGroups, Group } from "@/lib/types";

describe("EventCard - Add to Google Calendar link", () => {
  const baseEvent: EventWithGroups = {
    id: "event-1",
    tenant_id: "tenant-1",
    name: "Test Event",
    date: "2026-01-03",
    description: "Test description",
    start_time: "09:00",
    end_time: "10:00",
    event_link: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: "user-1",
    visibility: "public",
    groups: [],
  };

  const allGroups: Group[] = [];

  beforeEach(() => {
    // Desktop
    window.innerWidth = 1024;
  });

  it("should render a Google Calendar link that opens a new tab on desktop", () => {
    render(
      <EventCard
        event={baseEvent}
        isEditable={false}
        onEventUpdated={jest.fn()}
        onDeleteEvent={jest.fn()}
        allGroups={allGroups}
      />,
    );

    const link = screen.getByRole("link", { name: "events:addToGoogleCalendar" });
    expect(link).toHaveAttribute("href");
    expect(link.getAttribute("href")).toContain("calendar.google.com/calendar/render");
    expect(link.getAttribute("href")).toContain("action=TEMPLATE");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should omit target on mobile so universal links can open the app", () => {
    window.innerWidth = 375;

    render(
      <EventCard
        event={baseEvent}
        isEditable={false}
        onEventUpdated={jest.fn()}
        onDeleteEvent={jest.fn()}
        allGroups={allGroups}
      />,
    );

    const link = screen.getByRole("link", { name: "events:addToGoogleCalendar" });
    expect(link.getAttribute("target")).toBeNull();
  });
});
