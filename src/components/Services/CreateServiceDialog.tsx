
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useServiceForm } from "./hooks/useServiceForm";
import { saveServiceData } from "./services/serviceDataService"; // Fixed import
import { ServiceForm } from "./Forms/ServiceForm";

interface CreateServiceDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function CreateServiceDialog({ tenantId, onSuccess }: CreateServiceDialogProps) {
  const [open, setOpen] = useState(false);

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
    isSubmitting,
    setIsSubmitting,
    resetForm
  } = useServiceForm({
    tenantId,
    isOpen: open
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData = form.getValues();
      
      const success = await saveServiceData(
        formData,
        {
          admins: selectedAdmins,
          groups: selectedGroups,
          notes,
          roles
        }
      );
      
      if (success) {
        handleDialogClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          新增服事類型
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>新增服事類型</DialogTitle>
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
          submitLabel="新增服事類型"
        />
      </DialogContent>
    </Dialog>
  );
}
