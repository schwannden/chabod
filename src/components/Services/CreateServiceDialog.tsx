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
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

import { useServiceForm } from "./hooks/useServiceForm";
import { createServiceWithAssociations } from "@/lib/services";
import { ServiceForm } from "./Forms/ServiceForm";

interface CreateServiceDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function CreateServiceDialog({ tenantId, onSuccess }: CreateServiceDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
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
    resetForm,
  } = useServiceForm({
    tenantId,
    isOpen: open,
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData = form.getValues();

      // Trim name value before submission
      const name = formData.name.trim();

      // Ensure notes have the required text property
      const validatedNotes = notes.map((note) => ({
        text: note.text || "", // Ensure text is never undefined
        link: note.link,
      })) as { text: string; link?: string }[];

      // Ensure roles have the required name property
      const validatedRoles = roles.map((role) => ({
        name: role.name || "", // Ensure name is never undefined
        description: role.description,
      })) as { name: string; description?: string }[];

      // Create service with all associations
      await createServiceWithAssociations(
        {
          name: name,
          tenant_id: formData.tenant_id,
          default_start_time: formData.default_start_time || null,
          default_end_time: formData.default_end_time || null,
        },
        selectedAdmins,
        selectedGroups,
        validatedNotes,
        validatedRoles,
      );

      toast({
        title: t("services:serviceTypeCreated"),
        description: t("services:serviceTypeCreatedSuccess"),
      });
      handleDialogClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating service:", error);
      toast({
        title: t("common:error"),
        description: t("services:createServiceTypeError"),
        variant: "destructive",
      });
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
          {t("services:addServiceType")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("services:addServiceType")}</DialogTitle>
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
          submitLabel={t("services:addServiceType")}
          isEditing={false}
        />
      </DialogContent>
    </Dialog>
  );
}
