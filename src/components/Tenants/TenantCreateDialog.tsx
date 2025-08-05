import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantForm, TenantFormData } from "./TenantForm";
import { createTenant, createTenantMetadata } from "@/lib/tenant-utils";
import { useTranslation } from "react-i18next";

interface TenantCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTenantCreated: () => void;
}

export function TenantCreateDialog({ isOpen, onClose, onTenantCreated }: TenantCreateDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation("tenant");

  const handleSubmit = async (formData: TenantFormData) => {
    setIsCreating(true);

    try {
      // Create the tenant first
      const newTenant = await createTenant(formData.name, formData.slug);

      if (newTenant) {
        // Create/update the metadata
        const metadataData = {
          tax_id: formData.tax_id || null,
          contact_email: formData.contact_email,
          address: formData.address,
          website: formData.website || null,
          phone_number: formData.phone_number || null,
        };

        await createTenantMetadata(newTenant.id, metadataData);
      }

      toast({
        title: t("created"),
        description: t("createdSuccess", { name: formData.name }),
      });
      onTenantCreated();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "Unknown error";
      toast({
        title: t("errorCreating"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createNew")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>

        <TenantForm
          initialValues={{
            name: "",
            slug: "",
            tax_id: "",
            contact_email: "",
            address: "",
            website: "",
            phone_number: "",
          }}
          onSubmit={handleSubmit}
          isProcessing={isCreating}
          processingText={t("creating")}
          submitText={t("createChurch")}
          onCancel={onClose}
          autoGenerateSlug={true}
        />
      </DialogContent>
    </Dialog>
  );
}
