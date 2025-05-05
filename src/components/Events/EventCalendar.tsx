import * as React from "react";
import { EventWithGroups } from "@/lib/types";
import { EventCellTooltip } from "./EventCellTooltip";
import { GenericCalendar, BaseEvent } from "@/components/shared/GenericCalendar";

type EventCalendarProps = {
  events: EventWithGroups[];
  isLoading?: boolean;
};

export const EventCalendar: React.FC<EventCalendarProps> = ({ events, isLoading }) => {
  const renderEventTooltip = React.useCallback((event: BaseEvent) => {
    // Cast the BaseEvent back to EventWithGroups since we know that's what we're providing
    return <EventCellTooltip event={event as EventWithGroups} />;
  }, []);

  return (
    <GenericCalendar events={events} isLoading={isLoading} renderTooltip={renderEventTooltip} />
  );
};
