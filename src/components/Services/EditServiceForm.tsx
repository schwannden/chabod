
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ServiceDetailsForm } from "./Forms/ServiceDetailsForm";
import { ServiceAdminsForm } from "./Forms/ServiceAdminsForm";
import { ServiceGroupsForm } from "./Forms/ServiceGroupsForm";
import { ServiceNotesForm } from "./Forms/ServiceNotesForm";
import { ServiceRolesForm } from "./Forms/ServiceRolesForm";
import { useServiceEdit } from "./hooks/useServiceEdit";
import { Service } from "@/lib/services";

interface EditServiceFormProps {
  service: Service;
  isOpen: boolean;
  onSubmit: (formData: any, selectedData: {
    admins: string[],
    groups: string[],
    notes: { title: string; content?: string }[],
    roles: { name: string; description?: string }[]
  }) => Promise<void>;
  onCancel: () => void;
}

export function EditServiceForm({
  service,
  isOpen,
  onSubmit,
  onCancel
}: EditServiceFormProps) {
  const {
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
    isSubmitting
  } = useServiceEdit(service, isOpen);

  const handleSubmit = async () => {
    const formData = form.getValues();
    await onSubmit(formData, {
      admins: selectedAdmins,
      groups: selectedGroups,
      notes,
      roles
    });
  };

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
        <Button variant="outline" onClick={onCancel} type="button">取消</Button>
        <Button 
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "更新中..." : "更新服事類型"}
        </Button>
      </div>
    </>
  );
}
