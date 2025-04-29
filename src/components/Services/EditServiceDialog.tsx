
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
  addServiceNote,
  addServiceRole,
  addServiceGroup,
  getGroupsForService,
  isServiceAdmin
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
      // In a complete implementation, we would also fetch notes and roles
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
      // Fix: Use getGroupsForService instead which returns string[] of group IDs
      const groupIds = await getGroupsForService(service.id);
      setSelectedGroups(groupIds);
    } catch (error) {
      console.error("Error fetching service groups:", error);
    }
  };

  const fetchServiceAdmins = async () => {
    try {
      // This is a placeholder - in a real implementation, you would fetch service admins
      // and set them in the selectedAdmins state
      // For now we'll just add a console log since we don't have this functionality yet
      console.log("Fetch service admins for service ID:", service.id);
      // Ideally you'd have a function like:
      // const admins = await getServiceAdmins(service.id);
      // setSelectedAdmins(admins.map(admin => admin.user_id));
    } catch (error) {
      console.error("Error fetching service admins:", error);
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      // Update service
      await updateService(service.id, {
        name: values.name,
        tenant_id: values.tenant_id,
        default_start_time: values.default_start_time || null,
        default_end_time: values.default_end_time || null,
      });
      
      // In a complete implementation, we would:
      // 1. Delete existing admins, groups, notes, roles
      // 2. Add new ones based on the selected items
      
      toast.success("服事類型已更新");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("更新服事類型時發生錯誤");
    }
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setActiveTab("details");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={handleDialogClose}>取消</Button>
          <Button onClick={form.handleSubmit(onSubmit)}>更新服事類型</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
