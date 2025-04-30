
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
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

interface ServiceFormData {
  name: string;
  tenant_id: string;
  default_start_time?: string;
  default_end_time?: string;
}

interface SelectedData {
  admins: string[];
  groups: string[];
  notes: NoteFormValues[];
  roles: RoleFormValues[];
}

export async function updateServiceData(
  serviceId: string,
  tenantId: string,
  formData: ServiceFormData,
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
        tenant_id: tenantId,
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
        tenant_id: tenantId,
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
