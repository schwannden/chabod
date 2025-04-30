
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Service } from "@/lib/services";
import { EditServiceForm } from "./EditServiceForm";
import { updateServiceData } from "./services/serviceUpdateService";

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
  
  const handleSubmit = async (formData: any, selectedData: any) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const success = await updateServiceData(
        service.id,
        service.tenant_id,
        formData,
        selectedData
      );
      
      if (success) {
        onSuccess?.();
        handleDialogClose();
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("更新服事類型時發生錯誤");
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
        
        <EditServiceForm
          service={service}
          isOpen={open}
          onSubmit={handleSubmit}
          onCancel={handleDialogClose}
        />
      </DialogContent>
    </Dialog>
  );
}
