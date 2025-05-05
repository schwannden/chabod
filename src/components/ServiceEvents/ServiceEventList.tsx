import { useState, useEffect } from "react";
import { ServiceEventWithService } from "@/lib/services/types";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ServiceEventRow } from "./ServiceEventRow";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { deleteServiceEvent } from "@/lib/services/service-event-crud";

interface ServiceEventListProps {
  serviceEvents: ServiceEventWithService[];
  isLoading: boolean;
  tenantId: string;
  onEventUpdated: () => void;
  services: { id: string; name: string }[];
}

export function ServiceEventList({
  serviceEvents,
  isLoading,
  tenantId,
  onEventUpdated,
  services,
}: ServiceEventListProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [editableEvents, setEditableEvents] = useState<Record<string, boolean>>({});

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
        // For simplicity, check if the user is a tenant owner
        const { data: isOwner, error: ownerError } = await supabase.rpc("is_tenant_owner", {
          tenant_uuid: tenantId,
          user_uuid: user.id,
        });

        if (ownerError) {
          console.error("Error checking tenant owner:", ownerError);
        }

        // If user is a tenant owner, they can edit all events
        if (isOwner) {
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
  }, [user, serviceEvents, tenantId]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteServiceEvent(eventId);

      toast({
        title: "事件刪除成功",
        description: "服事排班已刪除",
      });

      // Call the onEventUpdated callback to refresh the parent components
      onEventUpdated();
    } catch (error) {
      console.error("Error deleting service event:", error);
      toast({
        title: "錯誤",
        description: "刪除服事排班時出錯",
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
          <CardTitle>未找到服事排班</CardTitle>
          <CardDescription>沒有符合您篩選條件的服事排班</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>服事排班列表</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>服事</TableHead>
                <TableHead>副標題</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
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
