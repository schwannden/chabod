import React from "react";
import { format } from "date-fns";
import { EventWithGroups, Group } from "@/lib/types";
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
  const formattedDate = format(new Date(event.date), "MMMM d, yyyy");
  const hasTime = event.start_time || event.end_time;

  let timeDisplay = "";
  if (event.start_time && event.end_time) {
    timeDisplay = `${event.start_time} - ${event.end_time}`;
  } else if (event.start_time) {
    timeDisplay = `${t("events:startsAt")} ${event.start_time}`;
  } else if (event.end_time) {
    timeDisplay = `${t("events:endsAt")} ${event.end_time}`;
  }

  return (
    <Card className={cn("relative", event.visibility === "private" && "border-primary/30")}>
      {isEditable && (
        <EventActions
          event={event}
          onEventUpdated={onEventUpdated}
          onDeleteEvent={onDeleteEvent}
          onCopyEvent={onCopyEvent}
          allGroups={allGroups}
        />
      )}

      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-4 w-4" /> {formattedDate}
          {hasTime && (
            <>
              <span className="mx-1">•</span>
              <Clock className="h-4 w-4" /> {timeDisplay}
            </>
          )}
        </CardDescription>
      </CardHeader>

      {event.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </CardContent>
      )}

      {(event.event_link || (event.groups && event.groups.length > 0)) && (
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
      )}
    </Card>
  );
}
