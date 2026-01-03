import React from "react";
import { format } from "date-fns";
import { EventWithGroups, Group } from "@/lib/types";
import { getDateLocale } from "@/lib/dateUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EventActions } from "./EventActions";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { AddToGoogleCalendarLink } from "@/components/shared/AddToGoogleCalendarLink";
import { combineDateAndTimeLocal, parseISODateLocal } from "@/lib/googleCalendar";

interface EventCardProps {
  event: EventWithGroups;
  isEditable: boolean;
  onEventUpdated: () => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onCopyEvent?: (event: EventWithGroups) => void;
  allGroups: Group[];
}

export function EventCard({
  event,
  isEditable,
  onEventUpdated,
  onDeleteEvent,
  onCopyEvent,
  allGroups,
}: EventCardProps) {
  const { t } = useTranslation();
  const formattedDate = format(new Date(event.date), "PPP", { locale: getDateLocale() });
  const hasTime = event.start_time || event.end_time;

  let timeDisplay = "";
  if (event.start_time && event.end_time) {
    timeDisplay = `${event.start_time} - ${event.end_time}`;
  } else if (event.start_time) {
    timeDisplay = `${t("events:startsAt")} ${event.start_time}`;
  } else if (event.end_time) {
    timeDisplay = `${t("events:endsAt")} ${event.end_time}`;
  }

  const calendarLabel = t("events:addToGoogleCalendar");
  const hasAnyTime = !!event.start_time || !!event.end_time;
  const calendarStart = hasAnyTime
    ? ((event.start_time && combineDateAndTimeLocal(event.date, event.start_time)) ??
      parseISODateLocal(event.date) ??
      new Date())
    : (parseISODateLocal(event.date) ?? new Date());
  const calendarEnd = hasAnyTime
    ? ((event.end_time && combineDateAndTimeLocal(event.date, event.end_time)) ??
      new Date(calendarStart.getTime() + 60 * 60 * 1000))
    : calendarStart;
  const calendarDetails = [
    event.description ?? "",
    event.event_link ? `\n\n${event.event_link}` : "",
  ].join("");

  return (
    <Card className={cn("relative", event.visibility === "private" && "border-primary/30")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{event.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {formattedDate}
              {hasTime && (
                <>
                  <span className="mx-1">•</span>
                  <Clock className="h-4 w-4" /> {timeDisplay}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AddToGoogleCalendarLink
              title={event.name}
              start={calendarStart}
              end={calendarEnd}
              isAllDay={!hasAnyTime}
              details={calendarDetails}
              label={calendarLabel}
              className="px-0"
            />
            {isEditable && (
              <EventActions
                className="shrink-0"
                event={event}
                onEventUpdated={onEventUpdated}
                onDeleteEvent={onDeleteEvent}
                onCopyEvent={onCopyEvent}
                allGroups={allGroups}
              />
            )}
          </div>
        </div>
      </CardHeader>

      {event.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </CardContent>
      )}

      <CardFooter className="flex flex-wrap gap-2">
        {event.event_link && (
          <a
            href={event.event_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline hover:no-underline"
          >
            {t("events:eventLinkText")}
          </a>
        )}

        {event.groups &&
          event.groups.length > 0 &&
          event.groups.map((group) =>
            group ? (
              <Badge key={group.id} variant="outline">
                {group.name}
              </Badge>
            ) : null,
          )}

        {event.visibility === "private" && (
          <Badge variant="secondary" className="ml-auto">
            {t("events:private")}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
