import React from "react";
import { Clock } from "lucide-react";
import { ServiceEventWithService } from "@/lib/services/types";

interface ServiceEventCellTooltipProps {
  event: ServiceEventWithService;
  serviceName: string;
}

export const ServiceEventCellTooltip: React.FC<ServiceEventCellTooltipProps> = ({
  event,
  serviceName,
}) => {
  // Format time for display (e.g., "12:30" from "12:30:00")
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "";
    return timeString.split(":").slice(0, 2).join(":");
  };

  return (
    <div className="p-2">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-start">
          <div className="font-semibold">{serviceName}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </div>
        </div>

        {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
      </div>
    </div>
  );
};
