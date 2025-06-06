import { useState, useEffect } from "react";
import { Group, EventWithGroups } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useTenantRole } from "@/hooks/useTenantRole";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EventCard } from "./EventCard";
import { useTranslation } from "react-i18next";

interface EventListProps {
  events: EventWithGroups[];
  isLoading: boolean;
  tenantSlug: string;
  onEventUpdated: () => void;
  allGroups: Group[];
  onCopyEvent?: (event: EventWithGroups) => void;
}

export function EventList({
  events,
  isLoading,
  tenantSlug,
  onEventUpdated,
  allGroups,
  onCopyEvent,
}: EventListProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const { role } = useTenantRole(tenantSlug, user?.id);
  const [editableEvents, setEditableEvents] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  const sortedEvents = [...events].sort((a, b) => {
    const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateComparison !== 0) return dateComparison;

    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    if (a.start_time) return -1;
    if (b.start_time) return 1;
    return 0;
  });

  useEffect(() => {
    const checkPermissions = async () => {
      // Skip permission check if user is not authenticated or no events to check
      if (!user || events.length === 0) {
        setEditableEvents({});
        return;
      }

      const permissions: Record<string, boolean> = {};

      try {
        // If user is a tenant owner, they can edit all events
        if (role === "owner") {
          events.forEach((event) => {
            permissions[event.id] = true;
          });
        } else {
          // Otherwise, they can only edit events they created
          events.forEach((event) => {
            permissions[event.id] = event.created_by === user.id;
          });
        }

        setEditableEvents(permissions);
      } catch (error) {
        console.error("Error checking edit permissions:", error);
        // Initialize with event creators having permission
        events.forEach((event) => {
          permissions[event.id] = event.created_by === user?.id;
        });
        setEditableEvents(permissions);
      }
    };

    checkPermissions();
  }, [user, events, role]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      console.log("Deleting event:", eventId);
      const { error } = await supabase.from("events").delete().eq("id", eventId);

      if (error) throw error;

      toast({
        title: t("events.eventDeleted"),
        description: t("events.eventDeletedSuccess"),
      });
      onEventUpdated();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: t("common.error"),
        description: t("events.eventDeleteError"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("events.noEventsFound")}</CardTitle>
          <CardDescription>{t("events.noEventsMatchingFilters")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {sortedEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isEditable={editableEvents[event.id] || false}
          onEventUpdated={onEventUpdated}
          onDeleteEvent={handleDeleteEvent}
          onCopyEvent={onCopyEvent}
          allGroups={allGroups}
        />
      ))}
    </div>
  );
}
