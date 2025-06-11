import { useState, useEffect } from "react";
import { ServiceEventWithService } from "@/lib/services/types";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useTenantRole } from "@/hooks/useTenantRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ServiceEventRow } from "./ServiceEventRow";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { deleteServiceEvent } from "@/lib/services/service-event-crud";
import { useTranslation } from "react-i18next";

interface ServiceEventListProps {
  serviceEvents: ServiceEventWithService[];
  isLoading: boolean;
  tenantSlug: string;
  onEventUpdated: () => void;
  services: { id: string; name: string }[];
}

export function ServiceEventList({
  serviceEvents,
  isLoading,
  tenantSlug,
  onEventUpdated,
  services,
}: ServiceEventListProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const { role } = useTenantRole(tenantSlug, user?.id);
  const [editableEvents, setEditableEvents] = useState<Record<string, boolean>>({});
  const { t } = useTranslation("services");

  const sortedEvents = [...serviceEvents].sort((a, b) => {
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
      if (!user || serviceEvents.length === 0) return;

      const permissions: Record<string, boolean> = {};

      try {
        // If user is a tenant owner, they can edit all events
        if (role === "owner") {
          serviceEvents.forEach((event) => {
            permissions[event.id] = true;
          });
        } else {
          // Check if user is a service admin for each event's service
          for (const event of serviceEvents) {
            const { data: isAdmin, error: adminError } = await supabase
              .from("service_admins")
              .select("id")
              .eq("service_id", event.service_id)
              .eq("user_id", user.id);

            if (adminError) {
              console.error("Error checking service admin:", adminError);
            }

            permissions[event.id] = isAdmin && isAdmin.length > 0;
          }
        }

        setEditableEvents(permissions);
      } catch (error) {
        console.error("Error checking edit permissions:", error);
        // Initialize with no permissions by default
        serviceEvents.forEach((event) => {
          permissions[event.id] = false;
        });
        setEditableEvents(permissions);
      }
    };

    checkPermissions();
  }, [user, serviceEvents, role]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteServiceEvent(eventId);

      toast({
        title: t("eventDeletedSuccess"),
        description: t("serviceScheduleDeleted"),
      });

      // Call the onEventUpdated callback to refresh the parent components
      onEventUpdated();
    } catch (error) {
      console.error("Error deleting service event:", error);
      toast({
        title: t("error"),
        description: t("deleteServiceScheduleError"),
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
          <CardTitle>{t("noServiceSchedulesFound")}</CardTitle>
          <CardDescription>{t("noSchedulesMatchFilter")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t("serviceSchedule")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("time")}</TableHead>
                <TableHead>{t("serviceType")}</TableHead>
                <TableHead>{t("subtitle")}</TableHead>
                <TableHead>{t("servicePersonnel")}</TableHead>
                <TableHead className="w-[100px]">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => (
                <ServiceEventRow
                  key={event.id}
                  event={event}
                  isEditable={editableEvents[event.id] || false}
                  onEventUpdated={onEventUpdated}
                  onDeleteEvent={handleDeleteEvent}
                  services={services}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
