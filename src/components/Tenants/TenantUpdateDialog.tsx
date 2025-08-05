import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantForm, TenantFormData } from "./TenantForm";
import { TenantWithMeta } from "@/lib/types";
import { updateTenantWithMetadata } from "@/lib/tenant-utils";

interface TenantUpdateDialogProps {
  tenant: TenantWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onTenantUpdated: () => void;
}

export function TenantUpdateDialog({
  tenant,
  isOpen,
  onClose,
  onTenantUpdated,
}: TenantUpdateDialogProps) {
  const { t } = useTranslation("tenant");
  const [initialValues, setInitialValues] = useState<TenantFormData>({
    name: tenant.name,
    slug: tenant.slug,
    tax_id: tenant.tenant_meta?.tax_id || "",
    contact_email: tenant.tenant_meta?.contact_email || "",
    address: tenant.tenant_meta?.address || "",
    website: tenant.tenant_meta?.website || "",
    phone_number: tenant.tenant_meta?.phone_number || "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setInitialValues({
        name: tenant.name,
        slug: tenant.slug,
        tax_id: tenant.tenant_meta?.tax_id || "",
        contact_email: tenant.tenant_meta?.contact_email || "",
        address: tenant.tenant_meta?.address || "",
        website: tenant.tenant_meta?.website || "",
        phone_number: tenant.tenant_meta?.phone_number || "",
      });
    }
  }, [tenant, isOpen]);

  const handleSubmit = async (formData: TenantFormData) => {
    setIsUpdating(true);

    try {
      // Separate tenant basic info from metadata
      const tenantData = { name: formData.name, slug: formData.slug };
      const metadataData = {
        tax_id: formData.tax_id || null,
        contact_email: formData.contact_email,
        address: formData.address,
        website: formData.website || null,
        phone_number: formData.phone_number || null,
      };

      await updateTenantWithMetadata(tenant.id, tenantData, metadataData);

      toast({
        title: t("updated"),
        description: t("updatedSuccess", { name: formData.name }),
      });
      onTenantUpdated();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "Unknown error";
      toast({
        title: "Error updating tenant",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Tenant</DialogTitle>
          <DialogDescription>Update the details of your tenant organization.</DialogDescription>
        </DialogHeader>

        <TenantForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isProcessing={isUpdating}
          processingText={t("creating")}
          submitText={t("updated")}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
