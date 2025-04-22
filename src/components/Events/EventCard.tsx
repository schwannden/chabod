
import React from "react";
import { Event, Group } from "@/lib/types";
import { format } from "date-fns";
import { Link as LinkIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventActions } from "./EventActions";

interface EventCardProps {
  event: Event;
  isEditable: boolean;
  onEventUpdated: () => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
  groups: Group[];
}

export function EventCard({ 
  event, 
  isEditable,
  onEventUpdated, 
  onDeleteEvent,
  groups 
}: EventCardProps) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{event.name}</CardTitle>
          {event.event_link && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              asChild
            >
              <a 
                href={event.event_link} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="sr-only">Event Link</span>
              </a>
            </Button>
          )}
        </div>
        <CardDescription>
          {format(new Date(event.date), "PPP")}
          {event.start_time && ` at ${event.start_time}`}
          {event.end_time && ` until ${event.end_time}`}
          {event.visibility === "private" && " • Private"}
        </CardDescription>
      </CardHeader>
      {event.description && (
        <CardContent>
          <p className="text-muted-foreground">{event.description}</p>
        </CardContent>
      )}
      {isEditable && (
        <EventActions
          event={event}
          onEventUpdated={onEventUpdated}
          onDeleteEvent={onDeleteEvent}
          groups={groups}
        />
      )}
    </Card>
  );
}
