
import { useState, useEffect } from "react";
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
import { getGroupsForService, getServiceNotes, getServiceRoles } from "@/lib/services";

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
  }, [isOpen, isEditMode, service?.id]);

  const fetchTenantMembers = async () => {
    try {
      const fetchedMembers = await getTenantMembers(tenantId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching tenant members:", error);
    }
  };

  const fetchTenantGroups = async () => {
    try {
      const fetchedGroups = await getTenantGroups(tenantId);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching tenant groups:", error);
    }
  };

  const fetchServiceGroups = async () => {
    if (!service) return;
    try {
      const groupIds = await getGroupsForService(service.id);
      setSelectedGroups(groupIds);
    } catch (error) {
      console.error("Error fetching service groups:", error);
    }
  };

  const fetchServiceAdmins = async () => {
    if (!service) return;
    try {
      const { data, error } = await supabase
        .from("service_admins")
        .select("user_id")
        .eq("service_id", service.id);
      
      if (error) throw error;
      
      const adminIds = data.map(admin => admin.user_id);
      setSelectedAdmins(adminIds);
    } catch (error) {
      console.error("Error fetching service admins:", error);
    }
  };

  const fetchServiceNotes = async () => {
    if (!service) return;
    try {
      const fetchedNotes = await getServiceNotes(service.id);
      // Convert the notes to the format expected by the NotesForm component
      const formattedNotes = fetchedNotes.map(note => ({
        title: note.text,
        content: note.link || ""
      }));
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error fetching service notes:", error);
    }
  };

  const fetchServiceRoles = async () => {
    if (!service) return;
    try {
      const fetchedRoles = await getServiceRoles(service.id);
      // Convert the roles to the format expected by the RolesForm component
      const formattedRoles = fetchedRoles.map(role => ({
        name: role.name,
        description: ""
      }));
      setRoles(formattedRoles);
    } catch (error) {
      console.error("Error fetching service roles:", error);
    }
  };

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
    isEditMode
  };
};
