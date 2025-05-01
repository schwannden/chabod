
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "@/contexts/AuthContext";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { Button } from "@/components/ui/button";
import { ServiceEvent, ServiceEventWithService } from "@/lib/services/types";
import { supabase } from "@/integrations/supabase/client";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { Tenant, Group } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";
import { ServiceEventCalendar } from "@/components/ServiceEvents/ServiceEventCalendar";
import { ServiceEventFilterBar } from "@/components/ServiceEvents/ServiceEventFilterBar";
import { CreateServiceEventDialog } from "@/components/ServiceEvents/CreateServiceEventDialog";
import { useTenantRole } from "@/hooks/useTenantRole";

export default function ServiceEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const { role, isLoading: isRoleLoading } = useTenantRole(slug, user?.id);
  const [serviceEvents, setServiceEvents] = useState<ServiceEventWithService[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [services, setServices] = useState<{id: string, name: string}[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(1)) // First day of current month
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() + 2)) // 2 months from now
  );
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canCreateEvent, setCanCreateEvent] = useState(false);
  const { toast } = useToast();

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

  const fetchServiceEvents = async () => {
    try {
      setIsEventsLoading(true);
      
      // Start with the basic query
      let query = supabase
        .from("service_events")
        .select(`
          *,
          service:service_id (
            id, 
            name
          )
        `);

      // Apply date filters if present
      if (startDate) {
        const formattedStartDate = startDate.toISOString().split('T')[0];
        query = query.gte("date", formattedStartDate);
      }

      if (endDate) {
        const formattedEndDate = endDate.toISOString().split('T')[0];
        query = query.lte("date", formattedEndDate);
      }

      // Service filter
      if (selectedService !== "all") {
        query = query.eq("service_id", selectedService);
      }

      const { data: allEvents, error } = await query;
      
      if (error) throw error;
      
      // If no group filtering, return all events
      if (selectedGroup === "all") {
        setServiceEvents(allEvents || []);
        setIsEventsLoading(false);
        return;
      }
      
      // For group filtering, we need to check service_groups
      const { data: serviceGroups, error: serviceGroupsError } = await supabase
        .from("service_groups")
        .select("service_id")
        .eq("group_id", selectedGroup);
        
      if (serviceGroupsError) throw serviceGroupsError;
      
      const serviceIds = serviceGroups?.map(sg => sg.service_id) || [];
      
      const filteredEvents = allEvents?.filter(event => 
        serviceIds.includes(event.service_id)
      ) || [];
      
      setServiceEvents(filteredEvents);
    } catch (error) {
      console.error("Error fetching service events:", error);
      toast({
        title: "Error",
        description: "Failed to load service events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEventsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase.from("groups").select("*");
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
    try {
      const { data, error } = await supabase.from("services").select("id, name");
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
    if (tenant) {
      fetchServiceEvents();
      fetchGroups();
      fetchServices();
    }
  }, [slug, tenant, selectedGroup, selectedService, startDate, endDate]);

  return (
    <TenantPageLayout
      title="服事表"
      tenantName={tenant?.name || ""}
      tenantSlug={slug || ""}
      isLoading={isLoading || isRoleLoading}
      breadcrumbItems={[{ label: "服事表" }]}
      action={
        canCreateEvent ? (
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            新增服事排班
          </Button>
        ) : null
      }
    >
      <ServiceEventCalendar 
        serviceEvents={serviceEvents}
        services={services}
        isLoading={isEventsLoading}
      />

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
      
      {/* Add CreateServiceEventDialog when it's implemented */}
      {isDialogOpen && (
        <CreateServiceEventDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onEventCreated={fetchServiceEvents}
          tenantId={tenant?.id || ""}
          services={services}
        />
      )}
    </TenantPageLayout>
  );
}
