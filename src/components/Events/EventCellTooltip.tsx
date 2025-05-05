
import React from "react";
import { Group } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type EventCellTooltipProps = {
  event: { id: string; name: string; start_time: string | null; end_time: string | null; groups?: string[]; };
  groupMap: Record<string, Group>;
};

export function EventCellTooltip({ event, groupMap }: EventCellTooltipProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium">{event.name}</span>
        {event.groups && event.groups.length > 0 && (
          <span className="flex gap-1 flex-wrap">
            {event.groups.map(
              (groupId) =>
                groupMap[groupId] && (
                  <Badge key={groupId} className="px-2 py-0.5 text-xs">
                    {groupMap[groupId].name}
                  </Badge>
                )
            )}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {event.start_time
          ? event.end_time
            ? `${event.start_time} - ${event.end_time}`
            : event.start_time
          : "Full Day"}
      </div>
    </div>
  );
}
