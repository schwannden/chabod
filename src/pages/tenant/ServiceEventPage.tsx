import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Group, Service } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { ServiceEventCalendar } from "@/components/ServiceEvents/ServiceEventCalendar";
import { ServiceEventFilterBar } from "@/components/ServiceEvents/ServiceEventFilterBar";
import { ServiceEventCreateDialog } from "@/components/ServiceEvents/ServiceEventCreateDialog";
import { useTenantRole } from "@/hooks/useTenantRole";
import { useEventFilters } from "@/hooks/useEventFilters";
import { useServiceEvents } from "@/hooks/useServiceEvents";
import { ServiceEventList } from "@/components/ServiceEvents/ServiceEventList";
import { GenericEventPage } from "@/components/shared/GenericEventPage";
import { getTenantGroups } from "@/lib/group-service";

export default function ServiceEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const { role } = useTenantRole(slug, user?.id);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [canCreateEvent, setCanCreateEvent] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the shared event filters hook
  const {
    selectedGroup,
    setSelectedGroup,
    selectedSecondary: selectedService,
    setSelectedSecondary: setSelectedService,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useEventFilters();

  // Use our service events hook
  const { serviceEvents, isLoading: isEventsLoading } = useServiceEvents({
    tenantId,
    selectedGroup,
    selectedService,
    startDate,
    endDate,
    refreshTrigger,
  });

  useEffect(() => {
    // Check if user can create events (is a service admin or tenant owner)
    const checkCreatePermission = async () => {
      if (!user) {
        setCanCreateEvent(false);
        return;
      }

      // Tenant owners can always create service events (no need to wait for tenantId)
      if (role === "owner") {
        setCanCreateEvent(true);
        return;
      }

      // For members/non-owners, we need to be more careful about timing
      // If role is still loading (undefined), don't hide the button yet
      if (role === undefined) {
        return; // Don't update state while role is loading
      }

      // For non-owners, check if user is a service admin for any service
      // Only check if tenantId is available, otherwise set to false
      if (tenantId) {
        try {
          const { data: serviceAdmins, error } = await supabase
            .from("service_admins")
            .select("id")
            .eq("user_id", user.id);

          if (error) {
            console.error("Error checking service admin status:", error);
            setCanCreateEvent(false);
            return;
          }

          // If user is a service admin for any service, they can create events
          setCanCreateEvent(serviceAdmins && serviceAdmins.length > 0);
        } catch (error) {
          console.error("Error checking create permissions:", error);
          setCanCreateEvent(false);
        }
      } else {
        // For non-owners without tenantId, set to false
        setCanCreateEvent(false);
      }
    };

    checkCreatePermission();
  }, [role, user, tenantId]);

  const fetchBaseData = useCallback(
    async (id: string) => {
      setTenantId(id);

      const fetchAllGroups = async (id: string) => {
        if (!id) return;
        try {
          const groups = await getTenantGroups(id);
          setAllGroups(groups || []);
        } catch (error) {
          console.error("Error fetching groups:", error);
          toast({
            title: "Error",
            description: "Failed to load groups. Some features may be limited.",
            variant: "destructive",
          });
        }
      };

      const fetchServices = async (id: string) => {
        if (!id) return;
        try {
          const { data, error } = await supabase.from("services").select().eq("tenant_id", id);

          if (error) throw error;
          setServices(data || []);
        } catch (error) {
          console.error("Error fetching services:", error);
          toast({
            title: "Error",
            description: "Failed to load services. Some features may be limited.",
            variant: "destructive",
          });
        }
      };

      await Promise.all([fetchAllGroups(id), fetchServices(id)]);
    },
    [toast],
  );

  const handleEventUpdated = () => {
    // Increment the refresh trigger to force a refetch of events
    setRefreshTrigger((prev) => prev + 1);
  };

  return slug ? (
    <GenericEventPage
      slug={slug}
      title="服事表"
      calendar={
        <ServiceEventCalendar
          serviceEvents={serviceEvents}
          services={services}
          isLoading={isEventsLoading}
        />
      }
      filterBar={
        <ServiceEventFilterBar
          allGroups={allGroups || []}
          services={services || []}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      }
      listView={
        <ServiceEventList
          serviceEvents={serviceEvents}
          isLoading={isEventsLoading}
          tenantSlug={slug}
          onEventUpdated={handleEventUpdated}
          services={services}
        />
      }
      actionButton={
        user && canCreateEvent ? (
          <ServiceEventCreateDialog
            onEventCreated={handleEventUpdated}
            tenantId={tenantId || ""}
            services={services}
          />
        ) : null
      }
      fetchBaseData={fetchBaseData}
    />
  ) : null;
}
