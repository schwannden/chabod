import React from "react";
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
import { Trash2, AlertTriangle } from "lucide-react";
import { Service } from "@/lib/services";
import { useTranslation } from "react-i18next";

interface ServiceDeleteDialogProps {
  service: Service;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ServiceDeleteDialog({
  service,
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ServiceDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {t("services.confirmDeleteServiceType")}
          </AlertDialogTitle>
          <AlertDialogDescription
            dangerouslySetInnerHTML={{
              __html: t("services.deleteServiceTypeConfirm", { serviceName: service.name }),
            }}
          />
        </AlertDialogHeader>

        <div className="px-6 pb-4">
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="flex items-start">
              <AlertTriangle className="mr-2 h-4 w-4 mt-0.5" />
              <div>
                <div className="font-medium">{t("services.deleteServiceTypeWarning")}</div>
                <ul className="list-disc pl-5 mt-1">
                  <li>{t("services.relatedSchedules")}</li>
                  <li>{t("services.relatedNotes")}</li>
                  <li>{t("services.relatedRoles")}</li>
                  <li>{t("services.relatedGroups")}</li>
                  <li>{t("services.relatedAdmins")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t("common.processing") : t("services.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
