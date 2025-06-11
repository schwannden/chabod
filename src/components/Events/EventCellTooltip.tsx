import { EventWithGroups } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type EventCellTooltipProps = {
  event: EventWithGroups;
};

export function EventCellTooltip({ event }: EventCellTooltipProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium">{event.name}</span>
        {event.groups && event.groups.length > 0 && (
          <span className="flex gap-1 flex-wrap">
            {event.groups.map((group) =>
              group ? (
                <Badge key={group.id} className="px-2 py-0.5 text-xs">
                  {group.name}
                </Badge>
              ) : null,
            )}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {event.start_time
          ? event.end_time
            ? `${event.start_time} - ${event.end_time}`
            : event.start_time
          : t("events:fullDay")}
      </div>
    </div>
  );
}
