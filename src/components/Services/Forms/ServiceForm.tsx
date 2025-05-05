import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ServiceDetailsForm } from "./ServiceDetailsForm";
import { ServiceAdminsForm } from "./ServiceAdminsForm";
import { ServiceGroupsForm } from "./ServiceGroupsForm";
import { ServiceNotesForm } from "./ServiceNotesForm";
import { ServiceRolesForm } from "./ServiceRolesForm";
import { UseFormReturn } from "react-hook-form";
import { Group, TenantMemberWithProfile } from "@/lib/types";
import { NoteFormValues } from "./ServiceNotesForm";
import { RoleFormValues } from "./ServiceRolesForm";
import { ServiceFormValues } from "../hooks/useServiceForm";

export interface ServiceFormProps {
  form: UseFormReturn<ServiceFormValues, unknown, undefined>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  members: TenantMemberWithProfile[];
  groups: Group[];
  selectedAdmins: string[];
  setSelectedAdmins: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroups: string[];
  setSelectedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  notes: NoteFormValues[];
  setNotes: React.Dispatch<React.SetStateAction<NoteFormValues[]>>;
  roles: RoleFormValues[];
  setRoles: React.Dispatch<React.SetStateAction<RoleFormValues[]>>;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  serviceId?: string;
  isEditing: boolean;
}

export function ServiceForm({
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
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  serviceId,
  isEditing
}: ServiceFormProps) {
  const tenantId = form.getValues().tenant_id;
  
  return (
    <>
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
            serviceId={serviceId}
            isEditing={isEditing}
          />
        </TabsContent>
        
        {/* Service Groups */}
        <TabsContent value="groups">
          <ServiceGroupsForm
            groups={groups}
            selectedGroups={selectedGroups}
            setSelectedGroups={setSelectedGroups}
            serviceId={serviceId}
            isEditing={isEditing}
          />
        </TabsContent>
        
        {/* Service Notes */}
        <TabsContent value="notes">
          <ServiceNotesForm 
            notes={notes} 
            setNotes={setNotes}
            serviceId={serviceId}
            tenantId={tenantId}
            isEditing={isEditing}
          />
        </TabsContent>
        
        {/* Service Roles */}
        <TabsContent value="roles">
          <ServiceRolesForm 
            roles={roles} 
            setRoles={setRoles}
            serviceId={serviceId}
            tenantId={tenantId}
            isEditing={isEditing}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={onCancel} type="button">取消</Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "處理中..." : submitLabel}
        </Button>
      </div>
    </>
  );
}
