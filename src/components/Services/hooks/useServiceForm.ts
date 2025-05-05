import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/lib/services";
import { Group, TenantMemberWithProfile } from "@/lib/types";
import { NoteFormValues } from "../Forms/ServiceNotesForm";
import { RoleFormValues } from "../Forms/ServiceRolesForm";
import { getTenantMembers } from "@/lib/member-service";
import { getTenantGroups } from "@/lib/group-service";
import { getServiceGroups, getServiceNotes, getServiceRoles } from "@/lib/services";

// Make sure name and tenant_id are required fields
export const serviceFormSchema = z.object({
  name: z.string().min(1, "名稱為必填"),
  tenant_id: z.string(),
  default_start_time: z.string().optional(),
  default_end_time: z.string().optional(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface UseServiceFormProps {
  tenantId: string;
  service?: Service;
  isOpen: boolean;
}

export const useServiceForm = ({ tenantId, service, isOpen }: UseServiceFormProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState<NoteFormValues[]>([]);
  const [roles, setRoles] = useState<RoleFormValues[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!service;

  // Setup form with validation schema
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || "",
      tenant_id: tenantId,
      default_start_time: service?.default_start_time || "",
      default_end_time: service?.default_end_time || "",
    },
  });

  const fetchTenantMembers = useCallback(async () => {
    try {
      const fetchedMembers = await getTenantMembers(tenantId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching tenant members:", error);
    }
  }, [tenantId]);

  const fetchTenantGroups = useCallback(async () => {
    try {
      const fetchedGroups = await getTenantGroups(tenantId);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching tenant groups:", error);
    }
  }, [tenantId]);

  const fetchServiceGroups = useCallback(async () => {
    if (!service) return;
    try {
      const groupIds = await getServiceGroups(service.id);
      setSelectedGroups(groupIds);
    } catch (error) {
      console.error("Error fetching service groups:", error);
    }
  }, [service]);

  const fetchServiceAdmins = useCallback(async () => {
    if (!service) return;
    try {
      const { data, error } = await supabase
        .from("service_admins")
        .select("user_id")
        .eq("service_id", service.id);

      if (error) throw error;

      const adminIds = data.map((admin) => admin.user_id);
      setSelectedAdmins(adminIds);
    } catch (error) {
      console.error("Error fetching service admins:", error);
    }
  }, [service]);

  const fetchServiceNotes = useCallback(async () => {
    if (!service) return;
    try {
      const fetchedNotes = await getServiceNotes(service.id);
      // Convert the notes to the format expected by the NotesForm component
      const formattedNotes = fetchedNotes.map((note) => ({
        text: note.text,
        link: note.link || "",
      }));
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error fetching service notes:", error);
    }
  }, [service]);

  const fetchServiceRoles = useCallback(async () => {
    if (!service) return;
    try {
      const fetchedRoles = await getServiceRoles(service.id);
      // Convert the roles to the format expected by the RolesForm component
      const formattedRoles = fetchedRoles.map((role) => ({
        name: role.name,
        description: role.description || "",
      }));
      setRoles(formattedRoles);
    } catch (error) {
      console.error("Error fetching service roles:", error);
    }
  }, [service]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTenantMembers();
      fetchTenantGroups();

      // If editing, fetch service-specific data
      if (isEditMode && service) {
        fetchServiceGroups();
        fetchServiceAdmins();
        fetchServiceNotes();
        fetchServiceRoles();
      }
    }
  }, [
    isOpen,
    isEditMode,
    service,
    fetchTenantMembers,
    fetchTenantGroups,
    fetchServiceGroups,
    fetchServiceAdmins,
    fetchServiceNotes,
    fetchServiceRoles,
  ]);

  const resetForm = () => {
    setActiveTab("details");
    form.reset({
      name: "",
      tenant_id: tenantId,
      default_start_time: "",
      default_end_time: "",
    });
    setSelectedAdmins([]);
    setSelectedGroups([]);
    setNotes([]);
    setRoles([]);
  };

  return {
    form,
    activeTab,
    setActiveTab,
    members,
    groups,
    selectedAdmins,
    setSelectedAdmins,
    selectedGroups,
    setSelectedGroups,
    notes,
    setNotes,
    roles,
    setRoles,
    isSubmitting,
    setIsSubmitting,
    resetForm,
    isEditMode,
  };
};
