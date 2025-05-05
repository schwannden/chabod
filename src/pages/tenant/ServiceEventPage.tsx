
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "@/contexts/AuthContext";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { Tenant, Group } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { ServiceEventCalendar } from "@/components/ServiceEvents/ServiceEventCalendar";
import { ServiceEventFilterBar } from "@/components/ServiceEvents/ServiceEventFilterBar";
import { CreateServiceEventDialog } from "@/components/ServiceEvents/CreateServiceEventDialog";
import { useTenantRole } from "@/hooks/useTenantRole";
import { useServiceEventFilters } from "@/hooks/useServiceEventFilters";
import { useServiceEvents } from "@/hooks/useServiceEvents";
import { ServiceEventAddButton } from "@/components/ServiceEvents/ServiceEventAddButton";
import { ServiceEventList } from "@/components/ServiceEvents/ServiceEventList";

export default function ServiceEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const { role, isLoading: isRoleLoading } = useTenantRole(slug, user?.id);
  const [groups, setGroups] = useState<Group[]>([]);
  const [services, setServices] = useState<{
    id: string;
    name: string;
    default_start_time?: string | null;
    default_end_time?: string | null;
  }[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canCreateEvent, setCanCreateEvent] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add a refresh trigger state
  const { toast } = useToast();

  // Use our custom hooks
  const {
    selectedGroup,
    setSelectedGroup,
    selectedService,
    setSelectedService,
    startDate,
    setStartDate,
    endDate,
    setEndDate
  } = useServiceEventFilters();

  const { serviceEvents, isLoading: isEventsLoading } = useServiceEvents({
    tenantId: tenant?.id || null,
    selectedGroup,
    selectedService,
    startDate,
    endDate,
    refreshTrigger // Pass the refreshTrigger to the hook
  });

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      try {
        const tenantData = await getTenantBySlug(slug);
        setTenant(tenantData);
      } catch (error) {
        console.error("Error fetching tenant:", error);
      }
    };
    
    fetchTenant();
  }, [slug]);

  useEffect(() => {
    // Check if user can create events (is a service admin or tenant owner)
    if (role === 'owner' || user) {
      setCanCreateEvent(true);
    } else {
      setCanCreateEvent(false);
    }
  }, [role, user]);

  const fetchGroups = async () => {
    if (!tenant?.id) return;
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("tenant_id", tenant.id);
        
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error",
        description: "Failed to load groups. Some features may be limited.",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    if (!tenant?.id) return;
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, default_start_time, default_end_time")
        .eq("tenant_id", tenant.id);
        
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

  useEffect(() => {
    if (tenant?.id) {
      fetchGroups();
      fetchServices();
    }
  }, [tenant]);

  const handleEventUpdated = () => {
    // Increment the refresh trigger to force a refetch of events
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <TenantPageLayout
      title="服事表"
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      isLoading={isLoading || isRoleLoading}
      breadcrumbItems={[{ label: "服事表" }]}
      action={
        canCreateEvent ? (
          <ServiceEventAddButton onClick={() => setIsDialogOpen(true)} />
        ) : null
      }
    >
      {/* Calendar View */}
      <ServiceEventCalendar 
        serviceEvents={serviceEvents}
        services={services}
        isLoading={isEventsLoading}
      />
      
      {/* Filter Bar */}
      <ServiceEventFilterBar
        groups={groups || []}
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
      
      {/* List View */}
      <ServiceEventList
        serviceEvents={serviceEvents}
        isLoading={isEventsLoading}
        tenantId={tenant?.id || ""}
        onEventUpdated={handleEventUpdated}
        services={services}
      />
      
      {isDialogOpen && (
        <CreateServiceEventDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onEventCreated={handleEventUpdated}
          tenantId={tenant?.id || ""}
          services={services}
        />
      )}
    </TenantPageLayout>
  );
}
