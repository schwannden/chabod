import { ServiceFormValues } from "../hooks/useServiceForm";
import { NoteFormValues } from "../Forms/ServiceNotesForm";
import { RoleFormValues } from "../Forms/ServiceRolesForm";
import { toast } from "sonner";
import {
  createService,
  updateService,
  addServiceAdmin,
  removeServiceAdmin,
  addServiceGroup,
  removeServiceGroup,
  addServiceNote,
  addServiceRole,
  getServiceAdmins,
  getServiceGroups,
  deleteServiceNotes,
  deleteServiceRoles
} from "@/lib/services";

interface AdditionalData {
  admins: string[];
  groups: string[];
  notes: NoteFormValues[];
  roles: RoleFormValues[];
}

export async function saveServiceData(
  formData: ServiceFormValues,
  additionalData: AdditionalData
): Promise<string | null> {
  try {
    // Insert the service using service-core function
    const service = await createService({
      name: formData.name,
      tenant_id: formData.tenant_id,
      default_start_time: formData.default_start_time || null,
      default_end_time: formData.default_end_time || null,
    });

    const serviceId = service.id;

    // Add admins using service-admin functions
    for (const adminId of additionalData.admins) {
      await addServiceAdmin(serviceId, adminId);
    }

    // Add groups using service-groups functions
    for (const groupId of additionalData.groups) {
      await addServiceGroup(serviceId, groupId);
    }

    // Add notes using service-notes function
    for (const note of additionalData.notes) {
      await addServiceNote({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        text: note.text,
        link: note.link || null
      });
    }

    // Add roles using service-roles function
    for (const role of additionalData.roles) {
      await addServiceRole({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        name: role.name,
        description: role.description || null
      });
    }

    toast.success("服事類型已創建");
    return serviceId;
  } catch (error) {
    console.error("Error saving service data:", error);
    toast.error("創建服事類型時發生錯誤");
    return null;
  }
}

export async function updateServiceData(
  serviceId: string,
  formData: ServiceFormValues,
  additionalData: AdditionalData
): Promise<boolean> {
  try {
    // Update the service using service-core function
    await updateService(serviceId, {
      name: formData.name,
      default_start_time: formData.default_start_time || null,
      default_end_time: formData.default_end_time || null,
    });

    // For update, we need to handle removing existing relationships first
    // Remove existing admins
    const existingAdmins = await getServiceAdmins(serviceId);
    
    if (existingAdmins) {
      for (const admin of existingAdmins) {
        await removeServiceAdmin(serviceId, admin.user_id);
      }
    }

    // Add new admins
    for (const adminId of additionalData.admins) {
      await addServiceAdmin(serviceId, adminId);
    }

    // Remove existing groups
    const existingGroups = await getServiceGroups(serviceId);
    
    if (existingGroups) {
      for (const group_id of existingGroups) {
        await removeServiceGroup(serviceId, group_id);
      }
    }

    // Add new groups
    for (const groupId of additionalData.groups) {
      await addServiceGroup(serviceId, groupId);
    }

    // For notes and roles, we'll still use the batch delete approach since there's no direct function for it
    // Remove existing notes and add new ones
    await deleteServiceNotes(serviceId);

    // Add new notes
    for (const note of additionalData.notes) {
      await addServiceNote({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        text: note.text,
        link: note.link || null
      });
    }

    // Remove existing roles and add new ones
    await deleteServiceRoles(serviceId);

    // Add new roles
    for (const role of additionalData.roles) {
      await addServiceRole({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        name: role.name,
        description: role.description || null
      });
    }

    toast.success("服事類型已更新");
    return true;
  } catch (error) {
    console.error("Error updating service data:", error);
    toast.error("更新服事類型時發生錯誤");
    return false;
  }
}
