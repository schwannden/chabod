import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useTenantRole } from "@/hooks/useTenantRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { getServices } from "@/lib/services";
import { getServiceEventsWithServices } from "@/lib/services/service-event-queries";
import { updateServiceEvent, deleteServiceEvent } from "@/lib/services/service-event-crud";
import { getServiceEventOwners } from "@/lib/services/service-event-owners";
import { updateServiceEventOwners } from "@/lib/services/service-event-owners";
import { GenericEventPage } from "@/components/shared/GenericEventPage";
import { ServiceScheduleCalendar } from "@/components/ServiceScheduleManagement/ServiceScheduleCalendar";
import { ServiceScheduleFilterBar } from "@/components/ServiceScheduleManagement/ServiceScheduleFilterBar";
import { ServiceScheduleList } from "@/components/ServiceScheduleManagement/ServiceScheduleList";
import { ServiceEventForCard } from "@/components/ServiceScheduleManagement/ServiceScheduleCard";
import { ServiceScheduleUpdateData } from "@/components/ServiceScheduleManagement/ServiceScheduleCardEdit";
import { ServiceEventCreateDialog } from "@/components/ServiceEvents/ServiceEventCreateDialog";
import { format, addMonths } from "date-fns";

// Helper: Get default wide date range for fetching (no UI controls)
const getDefaultDateRange = () => {
  const now = new Date();
  return {
    start: format(addMonths(now, -1), "yyyy-MM-dd"), // 1 month back
    end: format(addMonths(now, 3), "yyyy-MM-dd"), // 3 months forward
  };
};

export default function ServiceScheduleManagementPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading: isSessionLoading } = useSession();
  const { role } = useTenantRole(slug, user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(["services", "dashboard", "common"]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [dateRange] = useState(getDefaultDateRange()); // No UI setter, just for fetching
  const [canManage, setCanManage] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Redirect to auth page if user is not authenticated
  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isSessionLoading, navigate, slug]);

  // Use React Query for tenant data
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug || ""),
    enabled: !!slug && !!user,
  });

  // Use React Query for services data
  const { data: services = [] } = useQuery({
    queryKey: ["services", tenant?.id],
    queryFn: () => getServices(tenant?.id || ""),
    enabled: !!tenant?.id,
  });

  // Handle tenant not found
  useEffect(() => {
    if (!isTenantLoading && !tenant && slug && user) {
      navigate("/not-found");
    }
  }, [tenant, isTenantLoading, navigate, slug, user]);

  // Set default selected service when services load
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setCanManage(false);
        return;
      }

      // Tenant owners can always manage
      if (role === "owner") {
        setCanManage(true);
        return;
      }

      // For non-owners, check if user is service admin for selected service
      if (selectedServiceId && tenant?.id) {
        try {
          const serviceAdminQuery = supabase
            .from("service_admins")
            .select("id")
            .eq("user_id", user.id)
            .eq("service_id", selectedServiceId);

          const { data, error } =
            typeof serviceAdminQuery.maybeSingle === "function"
              ? await serviceAdminQuery.maybeSingle()
              : await serviceAdminQuery.single();

          if (error && error.code !== "PGRST116") {
            console.error("Error checking service admin status:", error);
            setCanManage(false);
            return;
          }

          setCanManage(!!data);
        } catch (error) {
          console.error("Error checking permissions:", error);
          setCanManage(false);
        }
      } else {
        setCanManage(false);
      }
    };

    checkPermissions();
  }, [user, role, selectedServiceId, tenant?.id]);

  // Use React Query for schedules data
  const {
    data: schedules = [],
    isLoading: isSchedulesLoading,
    refetch: refetchSchedules,
  } = useQuery({
    queryKey: ["schedules", tenant?.id, selectedServiceId, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!tenant?.id || !selectedServiceId || !dateRange.start) {
        return [];
      }

      // Fetch events with service info
      const events = await getServiceEventsWithServices(
        tenant.id,
        selectedServiceId,
        dateRange.start,
        dateRange.end,
      );

      // Fetch owners for each event
      const eventsWithOwners: ServiceEventForCard[] = await Promise.all(
        events.map(async (event) => {
          try {
            const owners = await getServiceEventOwners(event.id);
            return { ...event, owners };
          } catch (error) {
            console.error(`Error fetching owners for event ${event.id}:`, error);
            return { ...event, owners: [] };
          }
        }),
      );

      return eventsWithOwners;
    },
    enabled: !!tenant?.id && !!selectedServiceId && !!dateRange.start,
  });

  // Fetch base data callback for GenericEventPage (defined before early returns)
  const fetchBaseData = useCallback(async (tenantId: string) => {
    // Services are already fetched via React Query, this is just for compatibility
    // with GenericEventPage interface
    console.log("Tenant ID for base data:", tenantId);
  }, []);

  // Early return if user is not authenticated to prevent rendering
  if (!isSessionLoading && !user) {
    return null;
  }

  const handleUpdate = async (eventId: string, updates: ServiceScheduleUpdateData) => {
    try {
      // Update event basic info
      await updateServiceEvent(eventId, {
        date: updates.date,
        start_time: updates.startTime,
        end_time: updates.endTime,
        subtitle: updates.subtitle,
      });

      // Update owners if provided
      if (updates.owners && tenant?.id) {
        const ownersData = updates.owners.map((owner) => ({
          user_id: owner.userId,
          service_role_id: owner.roleId,
          tenant_id: tenant.id,
        }));
        await updateServiceEventOwners(eventId, ownersData);
      }

      // Refresh the schedules list
      await refetchSchedules();

      toast({
        title: t("services:scheduleUpdated"),
        description: t("services:scheduleUpdateSuccess"),
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: t("services:error"),
        description: t("services:scheduleUpdateError"),
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await deleteServiceEvent(eventId);
      await refetchSchedules();

      toast({
        title: t("services:serviceScheduleDeleted"),
        description: t("services:eventDeletedSuccess"),
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: t("services:error"),
        description: t("services:deleteServiceScheduleError"),
        variant: "destructive",
      });
    }
  };

  if (!slug) {
    return null;
  }

  return (
    <GenericEventPage
      slug={slug}
      title={t("dashboard:serviceScheduleManagementTitle")}
      description={t("dashboard:serviceScheduleManagementDesc")}
      calendar={<ServiceScheduleCalendar schedules={schedules} isLoading={isSchedulesLoading} />}
      filterBar={
        <ServiceScheduleFilterBar
          services={services}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
        />
      }
      listView={
        <ServiceScheduleList
          schedules={schedules}
          isLoading={isSchedulesLoading}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRefetch={refetchSchedules}
          canManage={canManage}
        />
      }
      actionButton={
        canManage && services.length > 0 ? (
          <Button
            className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
            size="icon"
            onClick={() => setIsCreateDialogOpen(true)}
            title={t("services:createSchedule")}
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : null
      }
      fetchBaseData={fetchBaseData}
      dialog={
        tenant && (
          <ServiceEventCreateDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onEventCreated={async () => {
              await refetchSchedules();
            }}
            tenantId={tenant.id}
            services={services.filter((s) => s.id === selectedServiceId)}
          />
        )
      }
    />
  );
}
