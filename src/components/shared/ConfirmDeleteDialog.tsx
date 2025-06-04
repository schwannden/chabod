import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  destructiveActionLabel?: string;
  cancelActionLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  destructiveActionLabel,
  cancelActionLabel,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  const defaultTitle = title || t("shared.confirmDelete");
  const defaultDescription = description || t("shared.confirmDeleteDesc");
  const defaultDestructiveLabel = destructiveActionLabel || t("shared.deleteButton");
  const defaultCancelLabel = cancelActionLabel || t("shared.cancelButton");

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple clicks during loading

    try {
      await onConfirm();
    } catch (error) {
      console.error("Error in confirm action:", error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {defaultTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>{defaultDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{defaultCancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t("common.processing") : defaultDestructiveLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
