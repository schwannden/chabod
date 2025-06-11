import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HighRiskDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmationText?: string;
  confirmationPlaceholder?: string;
  destructiveActionLabel?: string;
  cancelActionLabel?: string;
  isLoading?: boolean;
}

export function HighRiskDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmationText = "DELETE",
  confirmationPlaceholder,
  destructiveActionLabel,
  cancelActionLabel,
  isLoading = false,
}: HighRiskDeleteDialogProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");

  const defaultConfirmationPlaceholder =
    confirmationPlaceholder || t("shared:enterConfirmationPlaceholder");
  const defaultDestructiveLabel = destructiveActionLabel || t("shared:permanentDelete");
  const defaultCancelLabel = cancelActionLabel || t("shared:cancelButton");

  const isConfirmationValid = inputValue === confirmationText;

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
      setInputValue("");
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            {title || t("shared:highRiskDelete")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              <p className="font-medium">{t("shared:warningCannotUndo")}</p>
              <p>{description || t("shared:deleteWarningDesc")}</p>
            </div>
            <div>
              {t("shared:enterConfirmationText")}{" "}
              <span className="font-bold">{confirmationText}</span> {t("shared:toConfirmDelete")}
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={defaultConfirmationPlaceholder}
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            {defaultCancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t("common:processing") : defaultDestructiveLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
