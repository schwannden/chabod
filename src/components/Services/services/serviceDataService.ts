
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  createService,
  updateService,
  addServiceAdmin,
  removeServiceAdmin,
  addServiceNote,
  addServiceRole,
  addServiceGroup,
  removeServiceGroup,
} from "@/lib/services";
import { NoteFormValues } from "../Forms/ServiceNotesForm";
import { RoleFormValues } from "../Forms/ServiceRolesForm";
import { ServiceFormValues } from "../hooks/useServiceForm";

interface SelectedData {
  admins: string[];
  groups: string[];
  notes: NoteFormValues[];
  roles: RoleFormValues[];
}

export async function createServiceData(
  formData: ServiceFormValues,
  selectedData: SelectedData
): Promise<boolean> {
  try {
    // Create service
    const service = await createService({
      name: formData.name,
      tenant_id: formData.tenant_id,
      default_start_time: formData.default_start_time || null,
      default_end_time: formData.default_end_time || null,
    });
    
    // Add selected admins
    for (const adminId of selectedData.admins) {
      await addServiceAdmin(service.id, adminId);
    }
    
    // Add notes
    for (const note of selectedData.notes) {
      await addServiceNote({
        service_id: service.id,
        text: note.title,
        tenant_id: formData.tenant_id,
        link: note.content || null
      });
    }
    
    // Add roles
    for (const role of selectedData.roles) {
      await addServiceRole({
        service_id: service.id,
        name: role.name,
        tenant_id: formData.tenant_id,
      });
    }
    
    // Add selected groups
    for (const groupId of selectedData.groups) {
      await addServiceGroup(service.id, groupId);
    }
    
    toast.success("服事類型已新增");
    return true;
  } catch (error) {
    console.error("Error creating service:", error);
    toast.error("新增服事類型時發生錯誤");
    return false;
  }
}

export async function updateServiceData(
  serviceId: string,
  formData: ServiceFormValues,
  selectedData: SelectedData
): Promise<boolean> {
  try {
    // Update service basic details
    await updateService(serviceId, {
      name: formData.name,
      tenant_id: formData.tenant_id,
      default_start_time: formData.default_start_time || null,
      default_end_time: formData.default_end_time || null,
    });
    
    // Update service admins
    const { data: currentAdmins, error: adminsError } = await supabase
      .from("service_admins")
      .select("user_id")
      .eq("service_id", serviceId);
      
    if (adminsError) throw adminsError;
    
    const currentAdminIds = currentAdmins.map(admin => admin.user_id);
    
    // Remove admins that were deselected
    for (const adminId of currentAdminIds) {
      if (!selectedData.admins.includes(adminId)) {
        await removeServiceAdmin(serviceId, adminId);
      }
    }
    
    // Add new admins
    for (const adminId of selectedData.admins) {
      if (!currentAdminIds.includes(adminId)) {
        await addServiceAdmin(serviceId, adminId);
      }
    }
    
    // Update service groups
    const { data: currentGroups, error: groupsError } = await supabase
      .from("service_groups")
      .select("group_id")
      .eq("service_id", serviceId);
      
    if (groupsError) throw groupsError;
    
    const currentGroupIds = currentGroups.map(group => group.group_id);
    
    // Remove groups that were deselected
    for (const groupId of currentGroupIds) {
      if (!selectedData.groups.includes(groupId)) {
        await removeServiceGroup(serviceId, groupId);
      }
    }
    
    // Add new groups
    for (const groupId of selectedData.groups) {
      if (!currentGroupIds.includes(groupId)) {
        await addServiceGroup(serviceId, groupId);
      }
    }
    
    // Update notes - first delete all existing notes then add new ones
    await supabase
      .from("service_notes")
      .delete()
      .eq("service_id", serviceId);
      
    for (const note of selectedData.notes) {
      await addServiceNote({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        text: note.title,
        link: note.content || null
      });
    }
    
    // Update roles - first delete all existing roles then add new ones
    await supabase
      .from("service_roles")
      .delete()
      .eq("service_id", serviceId);
      
    for (const role of selectedData.roles) {
      await addServiceRole({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        name: role.name
      });
    }
    
    toast.success("服事類型已更新");
    return true;
  } catch (error) {
    console.error("Error updating service:", error);
    toast.error("更新服事類型時發生錯誤");
    return false;
  }
}
