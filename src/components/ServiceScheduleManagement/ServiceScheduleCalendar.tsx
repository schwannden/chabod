import * as React from "react";
import { ServiceEventForCard } from "./ServiceScheduleCard";
import { GenericCalendar, BaseEvent } from "@/components/shared/GenericCalendar";
import { Badge } from "@/components/ui/badge";

type ServiceScheduleCalendarProps = {
  schedules: ServiceEventForCard[];
  isLoading: boolean;
};

export const ServiceScheduleCalendar: React.FC<ServiceScheduleCalendarProps> = ({
  schedules,
  isLoading,
}) => {
  // Render tooltip content for calendar date dialogs
  const renderScheduleTooltip = React.useCallback((event: BaseEvent) => {
    const schedule = event as ServiceEventForCard;
    return (
      <div className="space-y-2">
        <div className="font-semibold">{schedule.service.name}</div>
        <div className="text-sm text-muted-foreground">
          {schedule.start_time} - {schedule.end_time}
        </div>
        {schedule.subtitle && <div className="text-sm">{schedule.subtitle}</div>}
        {schedule.owners.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {schedule.owners.map((owner) => (
              <Badge key={owner.id} variant="outline" className="text-xs">
                {owner.profile?.full_name || owner.profile?.email}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <GenericCalendar
      events={schedules}
      isLoading={isLoading}
      renderTooltip={renderScheduleTooltip}
    />
  );
};
