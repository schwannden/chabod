import React from "react";
import { screen } from "@testing-library/react";
import { render } from "../../test-utils";
import { ServiceEventRow } from "@/components/ServiceEvents/ServiceEventRow";
import { ServiceEventWithService } from "@/lib/services/types";

jest.mock("@/lib/services/service-event-owners", () => ({
  getServiceEventOwners: jest.fn().mockResolvedValue([]),
}));

describe("ServiceEventRow - Add to Google Calendar link", () => {
  const baseEvent: ServiceEventWithService = {
    id: "se-1",
    tenant_id: "tenant-1",
    service_id: "svc-1",
    date: "2026-01-03",
    start_time: "09:00:00",
    end_time: "10:00:00",
    subtitle: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    service: { id: "svc-1", name: "Worship" },
  };

  const props: React.ComponentProps<typeof ServiceEventRow> = {
    event: baseEvent,
    isEditable: false,
    onEventUpdated: jest.fn(),
    onDeleteEvent: jest.fn(),
    services: [{ id: "svc-1", name: "Worship" }],
  };

  beforeEach(() => {
    // Desktop
    window.innerWidth = 1024;
  });

  it("should render a Google Calendar link that opens a new tab on desktop", async () => {
    render(
      <table>
        <tbody>
          <ServiceEventRow {...props} />
        </tbody>
      </table>,
    );

    const link = await screen.findByRole("link", { name: "addToGoogleCalendar" });
    expect(link.getAttribute("href")).toContain("calendar.google.com/calendar/render");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should omit target on mobile so universal links can open the app", async () => {
    window.innerWidth = 375;

    render(
      <table>
        <tbody>
          <ServiceEventRow {...props} />
        </tbody>
      </table>,
    );

    const link = await screen.findByRole("link", { name: "addToGoogleCalendar" });
    expect(link.getAttribute("target")).toBeNull();
  });
});
