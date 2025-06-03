
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
import { createTenant } from "@/lib/tenant-utils";
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
  const { t } = useTranslation();

  const handleSubmit = async (formData: TenantFormData) => {
    setIsCreating(true);

    try {
      // Fixing this line - removing the extra argument
      await createTenant(formData.name, formData.slug);
      toast({
        title: t('tenant.created'),
        description: t('tenant.createdSuccess', { name: formData.name }),
      });
      onTenantCreated();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
      toast({
        title: t('tenant.errorCreating'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tenant.createNew')}</DialogTitle>
          <DialogDescription>{t('tenant.createDescription')}</DialogDescription>
        </DialogHeader>

        <TenantForm
          initialValues={{ name: "", slug: "" }}
          onSubmit={handleSubmit}
          isProcessing={isCreating}
          processingText={t('tenant.creating')}
          submitText={t('tenant.createChurch')}
          onCancel={onClose}
          autoGenerateSlug={true}
        />
      </DialogContent>
    </Dialog>
  );
}
