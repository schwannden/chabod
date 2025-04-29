
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TenantMemberWithProfile } from "@/lib/types";
import { Group } from "@/lib/types";
import { getTenantMembers } from "@/lib/member-service";
import { getTenantGroups } from "@/lib/group-service";
import { 
  createService, 
  addServiceAdmin, 
  addServiceNote,
  addServiceRole,
  addServiceGroup
} from "@/lib/services";

// Import our new form components
import { ServiceDetailsForm, ServiceFormValues } from "./Forms/ServiceDetailsForm";
import { ServiceAdminsForm } from "./Forms/ServiceAdminsForm";
import { ServiceGroupsForm } from "./Forms/ServiceGroupsForm";
import { ServiceNotesForm, NoteFormValues } from "./Forms/ServiceNotesForm";
import { ServiceRolesForm, RoleFormValues } from "./Forms/ServiceRolesForm";

interface CreateServiceDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function CreateServiceDialog({ tenantId, onSuccess }: CreateServiceDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState<NoteFormValues[]>([]);
  const [roles, setRoles] = useState<RoleFormValues[]>([]);
  const [open, setOpen] = useState(false);

  // Service form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "名稱為必填"),
      tenant_id: z.string(),
      default_start_time: z.string().optional(),
      default_end_time: z.string().optional(),
    })),
    defaultValues: {
      name: "",
      tenant_id: tenantId,
      default_start_time: "",
      default_end_time: "",
    },
  });

  // Fetch tenant members and groups when dialog opens
  useEffect(() => {
    if (open) {
      fetchTenantMembers();
      fetchTenantGroups();
    }
  }, [open, tenantId]);

  const fetchTenantMembers = async () => {
    try {
      const fetchedMembers = await getTenantMembers(tenantId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching tenant members:", error);
      toast.error("載入成員時發生錯誤");
    }
  };

  const fetchTenantGroups = async () => {
    try {
      const fetchedGroups = await getTenantGroups(tenantId);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching tenant groups:", error);
      toast.error("載入小組時發生錯誤");
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      // Ensure name is required
      if (!values.name) {
        toast.error("服事類型名稱為必填");
        return;
      }
      
      // Create service
      const service = await createService({
        name: values.name,
        tenant_id: values.tenant_id,
        default_start_time: values.default_start_time || null,
        default_end_time: values.default_end_time || null,
      });
      
      // Add selected admins
      for (const adminId of selectedAdmins) {
        await addServiceAdmin(service.id, adminId);
      }
      
      // Add notes - use text property instead of title
      for (const note of notes) {
        await addServiceNote({
          service_id: service.id,
          text: note.title,
          tenant_id: tenantId,
          // Note: link property is optional in the schema so we don't need to specify it
        });
      }
      
      // Add roles - only use name property
      for (const role of roles) {
        await addServiceRole({
          service_id: service.id,
          name: role.name,
          tenant_id: tenantId,
        });
      }
      
      // Add selected groups
      for (const groupId of selectedGroups) {
        await addServiceGroup({
          service_id: service.id,
          group_id: groupId,
        });
      }
      
      toast.success("服事類型已新增");
      handleDialogClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("新增服事類型時發生錯誤");
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    setActiveTab("details");
    form.reset();
    setSelectedAdmins([]);
    setSelectedGroups([]);
    setNotes([]);
    setRoles([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          新增服事類型
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>新增服事類型</DialogTitle>
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
          <Button onClick={form.handleSubmit(onSubmit)}>新增服事類型</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
