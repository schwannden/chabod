
import { useState, useEffect } from "react";
import { Group, EventWithGroups } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EventCard } from "./EventCard";
import { getTenantBySlug } from "@/lib/tenant-utils";

interface EventListProps {
  events: EventWithGroups[];
  isLoading: boolean;
  tenantId: string;
  onEventUpdated: () => void;
  allGroups: Group[];
  onCopyEvent?: (event: EventWithGroups) => void;
}

export function EventList({
  events,
  isLoading,
  tenantId,
  onEventUpdated,
  allGroups,
  onCopyEvent,
}: EventListProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [editableEvents, setEditableEvents] = useState<Record<string, boolean>>({});

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
        // Get the tenant UUID from the slug first
        const tenant = await getTenantBySlug(tenantId);

        if (!tenant) {
          console.error("Tenant not found with slug:", tenantId);
          return;
        }

        // Check if the user is a tenant owner
        const { data: isOwner, error: ownerError } = await supabase.rpc("is_tenant_owner", {
          tenant_uuid: tenant.id,
          user_uuid: user.id,
        });

        if (ownerError) {
          console.error("Error checking tenant owner:", ownerError);
        }

        // If user is a tenant owner, they can edit all events
        if (isOwner) {
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
  }, [user, events, tenantId]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
      onEventUpdated();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
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
          <CardTitle>No events found</CardTitle>
          <CardDescription>There are no events matching your filters.</CardDescription>
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
