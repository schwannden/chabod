
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Service } from "@/lib/services";
import { useServiceForm } from "./hooks/useServiceForm";
import { updateServiceData } from "./services/serviceDataService";
import { ServiceForm } from "./Forms/ServiceForm";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    setRoles
  } = useServiceForm({
    tenantId: service.tenant_id,
    service,
    isOpen: open
  });
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const formData = form.getValues();
      
      const success = await updateServiceData(
        service.id,
        formData,
        {
          admins: selectedAdmins,
          groups: selectedGroups,
          notes,
          roles
        }
      );
      
      if (success) {
        onSuccess?.();
        handleDialogClose();
      }
    } catch (error) {
      console.error("Error updating service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
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
        
        <ServiceForm
          form={form}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          members={members}
          groups={groups}
          selectedAdmins={selectedAdmins}
          setSelectedAdmins={setSelectedAdmins}
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
          notes={notes}
          setNotes={setNotes}
          roles={roles}
          setRoles={setRoles}
          onSubmit={handleSubmit}
          onCancel={handleDialogClose}
          isSubmitting={isSubmitting}
          submitLabel="更新服事類型"
        />
      </DialogContent>
    </Dialog>
  );
}
