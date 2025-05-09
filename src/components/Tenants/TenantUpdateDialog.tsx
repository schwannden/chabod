import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantForm, TenantFormData } from "./TenantForm";
import { Tenant } from "@/lib/types";
import { updateTenant } from "@/lib/tenant-utils";

interface TenantUpdateDialogProps {
  tenant: Tenant;
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
  const [initialValues, setInitialValues] = useState<TenantFormData>({
    name: tenant.name,
    slug: tenant.slug,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setInitialValues({
        name: tenant.name,
        slug: tenant.slug,
      });
    }
  }, [tenant, isOpen]);

  const handleSubmit = async (formData: TenantFormData) => {
    setIsUpdating(true);

    try {
      await updateTenant(tenant.id, formData.name, formData.slug);
      toast({
        title: "更新成功",
        description: `${formData.name} 已更新。`,
      });
      onTenantUpdated();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Tenant</DialogTitle>
          <DialogDescription>Update the details of your tenant organization.</DialogDescription>
        </DialogHeader>

        <TenantForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isProcessing={isUpdating}
          processingText="更新中..."
          submitText="更新教會資訊"
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
