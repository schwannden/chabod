import * as React from "react";
import { ServiceEventWithService } from "@/lib/services/types";
import { ServiceEventCellTooltip } from "./ServiceEventCellTooltip";
import { GenericCalendar, BaseEvent } from "@/components/shared/GenericCalendar";

type ServiceEventCalendarProps = {
  serviceEvents: ServiceEventWithService[];
  services: { id: string; name: string }[];
  isLoading: boolean;
};

export const ServiceEventCalendar: React.FC<ServiceEventCalendarProps> = ({
  serviceEvents,
  services,
  isLoading,
}) => {
  const serviceMap = React.useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])) as Record<string, string>,
    [services],
  );

  const renderEventTooltip = React.useCallback(
    (event: BaseEvent) => {
      // Cast the BaseEvent back to ServiceEventWithService since we know that's what we're providing
      const serviceEvent = event as ServiceEventWithService;
      return (
        <ServiceEventCellTooltip
          event={serviceEvent}
          serviceName={serviceMap[serviceEvent.service_id] || "Unknown Service"}
        />
      );
    },
    [serviceMap],
  );

  return (
    <GenericCalendar
      events={serviceEvents}
      isLoading={isLoading}
      renderTooltip={renderEventTooltip}
    />
  );
};
