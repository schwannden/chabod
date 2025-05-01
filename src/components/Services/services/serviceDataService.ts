import { supabase } from "@/integrations/supabase/client";
import { ServiceFormValues } from "../hooks/useServiceForm";
import { NoteFormValues } from "../Forms/ServiceNotesForm";
import { RoleFormValues } from "../Forms/ServiceRolesForm";
import { toast } from "sonner";

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
    // Insert the service
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .insert({
        name: formData.name,
        tenant_id: formData.tenant_id,
        default_start_time: formData.default_start_time || null,
        default_end_time: formData.default_end_time || null,
      })
      .select()
      .single();

    if (serviceError) throw serviceError;

    const serviceId = service.id;

    // Add admins
    if (additionalData.admins.length > 0) {
      const adminInserts = additionalData.admins.map((adminId) => ({
        service_id: serviceId,
        user_id: adminId,
      }));

      const { error: adminsError } = await supabase
        .from("service_admins")
        .insert(adminInserts);

      if (adminsError) throw adminsError;
    }

    // Add groups
    if (additionalData.groups.length > 0) {
      const groupInserts = additionalData.groups.map((groupId) => ({
        service_id: serviceId,
        group_id: groupId,
      }));

      const { error: groupsError } = await supabase
        .from("service_groups")
        .insert(groupInserts);

      if (groupsError) throw groupsError;
    }

    // Add notes
    if (additionalData.notes.length > 0) {
      const noteInserts = additionalData.notes.map((note) => ({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        text: note.text,
        link: note.link || null
      }));

      const { error: notesError } = await supabase
        .from("service_notes")
        .insert(noteInserts);

      if (notesError) throw notesError;
    }

    // Add roles
    if (additionalData.roles.length > 0) {
      const roleInserts = additionalData.roles.map((role) => ({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        name: role.name,
        description: role.description,
      }));

      const { error: rolesError } = await supabase
        .from("service_roles")
        .insert(roleInserts);

      if (rolesError) throw rolesError;
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
    // Update the service
    const { error: serviceError } = await supabase
      .from("services")
      .update({
        name: formData.name,
        default_start_time: formData.default_start_time || null,
        default_end_time: formData.default_end_time || null,
      })
      .eq("id", serviceId);

    if (serviceError) throw serviceError;

    // Remove existing admins and add new ones
    const { error: deleteAdminsError } = await supabase
      .from("service_admins")
      .delete()
      .eq("service_id", serviceId);

    if (deleteAdminsError) throw deleteAdminsError;

    if (additionalData.admins.length > 0) {
      const adminInserts = additionalData.admins.map((adminId) => ({
        service_id: serviceId,
        user_id: adminId,
      }));

      const { error: adminsError } = await supabase
        .from("service_admins")
        .insert(adminInserts);

      if (adminsError) throw adminsError;
    }

    // Remove existing groups and add new ones
    const { error: deleteGroupsError } = await supabase
      .from("service_groups")
      .delete()
      .eq("service_id", serviceId);

    if (deleteGroupsError) throw deleteGroupsError;

    if (additionalData.groups.length > 0) {
      const groupInserts = additionalData.groups.map((groupId) => ({
        service_id: serviceId,
        group_id: groupId,
      }));

      const { error: groupsError } = await supabase
        .from("service_groups")
        .insert(groupInserts);

      if (groupsError) throw groupsError;
    }

    // Remove existing notes and add new ones
    const { error: deleteNotesError } = await supabase
      .from("service_notes")
      .delete()
      .eq("service_id", serviceId);

    if (deleteNotesError) throw deleteNotesError;

    if (additionalData.notes.length > 0) {
      const noteInserts = additionalData.notes.map((note) => ({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        text: note.text,
        link: note.link || null
      }));

      const { error: notesError } = await supabase
        .from("service_notes")
        .insert(noteInserts);

      if (notesError) throw notesError;
    }

    // Remove existing roles and add new ones
    const { error: deleteRolesError } = await supabase
      .from("service_roles")
      .delete()
      .eq("service_id", serviceId);

    if (deleteRolesError) throw deleteRolesError;

    if (additionalData.roles.length > 0) {
      const roleInserts = additionalData.roles.map((role) => ({
        service_id: serviceId,
        tenant_id: formData.tenant_id,
        name: role.name,
        description: role.description,
      }));

      const { error: rolesError } = await supabase
        .from("service_roles")
        .insert(roleInserts);

      if (rolesError) throw rolesError;
    }

    toast.success("服事類型已更新");
    return true;
  } catch (error) {
    console.error("Error updating service data:", error);
    toast.error("更新服事類型時發生錯誤");
    return false;
  }
}
