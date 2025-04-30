
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Service } from "@/lib/services";
import { TenantMemberWithProfile } from "@/lib/types";
import { Group } from "@/lib/types";
import { getTenantMembers } from "@/lib/member-service";
import { getTenantGroups } from "@/lib/group-service";
import { 
  updateService, 
  addServiceAdmin,
  removeServiceAdmin,
  addServiceNote,
  addServiceRole,
  addServiceGroup,
  removeServiceGroup,
  getGroupsForService,
  getServiceNotes,
  getServiceRoles
} from "@/lib/services";

// Import form components
import { ServiceDetailsForm, ServiceFormValues } from "./Forms/ServiceDetailsForm";
import { ServiceAdminsForm } from "./Forms/ServiceAdminsForm";
import { ServiceGroupsForm } from "./Forms/ServiceGroupsForm";
import { ServiceNotesForm, NoteFormValues } from "./Forms/ServiceNotesForm";
import { ServiceRolesForm, RoleFormValues } from "./Forms/ServiceRolesForm";

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditServiceDialog({ 
  service, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditServiceDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState<NoteFormValues[]>([]);
  const [roles, setRoles] = useState<RoleFormValues[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Setup form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "名稱為必填"),
      tenant_id: z.string(),
      default_start_time: z.string().optional(),
      default_end_time: z.string().optional(),
    })),
    defaultValues: {
      name: service.name,
      tenant_id: service.tenant_id,
      default_start_time: service.default_start_time ?? "",
      default_end_time: service.default_end_time ?? "",
    },
  });

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchTenantMembers();
      fetchTenantGroups();
      fetchServiceGroups();
      fetchServiceAdmins();
      fetchServiceNotes();
      fetchServiceRoles();
    }
  }, [open, service.id]);

  const fetchTenantMembers = async () => {
    try {
      const fetchedMembers = await getTenantMembers(service.tenant_id);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching tenant members:", error);
      toast.error("載入成員時發生錯誤");
    }
  };

  const fetchTenantGroups = async () => {
    try {
      const fetchedGroups = await getTenantGroups(service.tenant_id);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching tenant groups:", error);
      toast.error("載入小組時發生錯誤");
    }
  };

  const fetchServiceGroups = async () => {
    try {
      const groupIds = await getGroupsForService(service.id);
      setSelectedGroups(groupIds);
    } catch (error) {
      console.error("Error fetching service groups:", error);
    }
  };

  const fetchServiceAdmins = async () => {
    try {
      // Get service admin user IDs
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

  const onSubmit = async (values: ServiceFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Update service basic details
      await updateService(service.id, {
        name: values.name,
        tenant_id: values.tenant_id,
        default_start_time: values.default_start_time || null,
        default_end_time: values.default_end_time || null,
      });
      
      // Update service admins
      const { data: currentAdmins, error: adminsError } = await supabase
        .from("service_admins")
        .select("user_id")
        .eq("service_id", service.id);
        
      if (adminsError) throw adminsError;
      
      const currentAdminIds = currentAdmins.map(admin => admin.user_id);
      
      // Remove admins that were deselected
      for (const adminId of currentAdminIds) {
        if (!selectedAdmins.includes(adminId)) {
          await removeServiceAdmin(service.id, adminId);
        }
      }
      
      // Add new admins
      for (const adminId of selectedAdmins) {
        if (!currentAdminIds.includes(adminId)) {
          await addServiceAdmin(service.id, adminId);
        }
      }
      
      // Update service groups
      const { data: currentGroups, error: groupsError } = await supabase
        .from("service_groups")
        .select("group_id")
        .eq("service_id", service.id);
        
      if (groupsError) throw groupsError;
      
      const currentGroupIds = currentGroups.map(group => group.group_id);
      
      // Remove groups that were deselected
      for (const groupId of currentGroupIds) {
        if (!selectedGroups.includes(groupId)) {
          await removeServiceGroup(service.id, groupId);
        }
      }
      
      // Add new groups
      for (const groupId of selectedGroups) {
        if (!currentGroupIds.includes(groupId)) {
          await addServiceGroup(service.id, groupId);
        }
      }
      
      // Update notes - first delete all existing notes then add new ones
      await supabase
        .from("service_notes")
        .delete()
        .eq("service_id", service.id);
        
      for (const note of notes) {
        await addServiceNote({
          service_id: service.id,
          tenant_id: service.tenant_id,
          text: note.title,
          link: note.content || null
        });
      }
      
      // Update roles - first delete all existing roles then add new ones
      await supabase
        .from("service_roles")
        .delete()
        .eq("service_id", service.id);
        
      for (const role of roles) {
        await addServiceRole({
          service_id: service.id,
          tenant_id: service.tenant_id,
          name: role.name
        });
      }
      
      toast.success("服事類型已更新");
      onSuccess?.();
      handleDialogClose();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("更新服事類型時發生錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setActiveTab("details");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleDialogClose();
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>編輯服事類型</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="details">基本資料</TabsTrigger>
            <TabsTrigger value="admins">管理員</TabsTrigger>
            <TabsTrigger value="groups">小組</TabsTrigger>
            <TabsTrigger value="notes">備註</TabsTrigger>
            <TabsTrigger value="roles">角色</TabsTrigger>
          </TabsList>
          
          {/* Basic Details */}
          <TabsContent value="details">
            <ServiceDetailsForm form={form} />
          </TabsContent>
          
          {/* Service Admins */}
          <TabsContent value="admins">
            <ServiceAdminsForm 
              members={members} 
              selectedAdmins={selectedAdmins}
              setSelectedAdmins={setSelectedAdmins}
            />
          </TabsContent>
          
          {/* Service Groups */}
          <TabsContent value="groups">
            <ServiceGroupsForm
              groups={groups}
              selectedGroups={selectedGroups}
              setSelectedGroups={setSelectedGroups}
            />
          </TabsContent>
          
          {/* Service Notes */}
          <TabsContent value="notes">
            <ServiceNotesForm notes={notes} setNotes={setNotes} />
          </TabsContent>
          
          {/* Service Roles */}
          <TabsContent value="roles">
            <ServiceRolesForm roles={roles} setRoles={setRoles} />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={handleDialogClose} type="button">取消</Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "更新中..." : "更新服事類型"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
