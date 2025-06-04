import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

import { Service, updateService } from "@/lib/services";
import { useServiceForm } from "./hooks/useServiceForm";
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
  onSuccess,
}: EditServiceDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
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
    setRoles,
  } = useServiceForm({
    tenantId: service.tenant_id,
    service,
    isOpen: open,
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const formData = form.getValues();

      // Trim name value before submission
      const name = formData.name.trim();

      // Direct call to updateService
      await updateService(service.id, {
        name: name,
        default_start_time: formData.default_start_time || null,
        default_end_time: formData.default_end_time || null,
      });

      toast({
        title: t("services.serviceTypeUpdated"),
        description: t("services.serviceTypeUpdatedSuccess"),
      });
      onSuccess?.();
      handleDialogClose();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description: t("services.updateServiceTypeError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleDialogClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("services.editServiceType")}</DialogTitle>
        </DialogHeader>

        <div className="mt-6">
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
            submitLabel={t("services.updateServiceType")}
            serviceId={service.id}
            isEditing={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
