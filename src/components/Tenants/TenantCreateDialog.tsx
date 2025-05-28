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

interface TenantCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTenantCreated: () => void;
}

export function TenantCreateDialog({ isOpen, onClose, onTenantCreated }: TenantCreateDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (formData: TenantFormData) => {
    setIsCreating(true);

    try {
      // Fixing this line - removing the extra argument
      await createTenant(formData.name, formData.slug);
      toast({
        title: "Tenant created",
        description: `${formData.name} has been created successfully.`,
      });
      onTenantCreated();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
      toast({
        title: "Error creating tenant",
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
          <DialogTitle>建立新教會</DialogTitle>
          <DialogDescription>建立一個新的教會，您將成為其所有者並管理它。</DialogDescription>
        </DialogHeader>

        <TenantForm
          initialValues={{ name: "", slug: "" }}
          onSubmit={handleSubmit}
          isProcessing={isCreating}
          processingText="建立中..."
          submitText="建立教會"
          onCancel={onClose}
          autoGenerateSlug={true}
        />
      </DialogContent>
    </Dialog>
  );
}
