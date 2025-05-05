import * as React from "react";
import { Event, Group } from "@/lib/types";
import { EventCellTooltip } from "./EventCellTooltip";
import { GenericCalendar, BaseEvent } from "@/components/shared/GenericCalendar";

type EventWithGroups = Event & { groups?: string[] };

type EventCalendarProps = {
  events: EventWithGroups[];
  groups: Group[];
  isLoading?: boolean;
};

export const EventCalendar: React.FC<EventCalendarProps> = ({ 
  events, 
  groups,
  isLoading 
}) => {
  const groupMap = React.useMemo(
    () => Object.fromEntries(groups.map(g => [g.id, g])) as Record<string, Group>, 
    [groups]
  );

  const renderEventTooltip = React.useCallback((event: BaseEvent) => {
    // Cast the BaseEvent back to EventWithGroups since we know that's what we're providing
    return <EventCellTooltip event={event as EventWithGroups} groupMap={groupMap} />;
  }, [groupMap]);

  return (
    <GenericCalendar
      events={events}
      isLoading={isLoading}
      renderTooltip={renderEventTooltip}
    />
  );
};
