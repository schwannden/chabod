import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useAccountDeletion } from "@/hooks/useAccountDeletion";
import { HighRiskDeleteDialog } from "@/components/shared/HighRiskDeleteDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AccountDeletionSection() {
  const { t } = useTranslation("profile");
  const { user } = useSession();
  const [showDialog, setShowDialog] = useState(false);
  const {
    isLoading,
    isChecking,
    eligibility,
    checkEligibility,
    initiateDeletion,
    confirmDeletion,
  } = useAccountDeletion();

  const handleDeleteClick = async () => {
    if (!user?.email) return;

    try {
      // First check if user can be deleted
      const result = await checkEligibility();

      if (result.canDelete) {
        // Initiate deletion (just eligibility check now)
        const initiationResult = await initiateDeletion(user.email);

        if (initiationResult.requiresConfirmation) {
          setShowDialog(true);
        }
      }
      // If user can't be deleted, the hook will show appropriate error messages
    } catch (error) {
      console.error("Error checking deletion eligibility:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user?.email) return;

    try {
      // No token needed - email confirmation already done in UI
      await confirmDeletion();
      setShowDialog(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      // Error handling is done in the hook
    }
  };

  if (!user) {
    return null;
  }

  const isProcessing = isLoading || isChecking;
  const hasBlockers = eligibility && !eligibility.canDelete && eligibility.blockers.length > 0;

  return (
    <div className="space-y-4">
      {/* Warning message */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">{t("deleteAccount.warningTitle")}</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>{t("deleteAccount.warningItem1")}</li>
              <li>{t("deleteAccount.warningItem2")}</li>
              <li>{t("deleteAccount.warningItem3")}</li>
              <li>{t("deleteAccount.warningItem4")}</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Show blockers if any */}
      {hasBlockers && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{t("deleteAccount.cannotDelete")}</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {eligibility.blockers.map((blocker, index) => (
                  <li key={index}>
                    {blocker.type === "sole_tenant_owner"
                      ? t("deleteAccount.blockerSoleTenantOwner", {
                          tenantName: blocker.tenantName,
                        })
                      : t("deleteAccount.blockerUnknown", { type: blocker.type })}
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-2">{t("deleteAccount.blockerResolution")}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* GDPR compliance note */}
      <div className="text-sm text-muted-foreground">
        <p>{t("deleteAccount.gdprNote")}</p>
      </div>

      {/* Delete button */}
      <div className="pt-4">
        <Button
          variant="destructive"
          onClick={handleDeleteClick}
          disabled={isProcessing}
          className="w-full sm:w-auto"
        >
          {isProcessing ? t("common:processing") : t("deleteAccount.button")}
        </Button>
      </div>

      {/* Confirmation dialog */}
      <HighRiskDeleteDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
        }}
        onConfirm={handleConfirmDelete}
        title={t("deleteAccount.confirmTitle")}
        description={t("deleteAccount.confirmDescription")}
        confirmationText={user.email}
        confirmationPlaceholder={t("deleteAccount.confirmPlaceholder")}
        destructiveActionLabel={t("deleteAccount.confirmButton")}
        isLoading={isLoading}
      />
    </div>
  );
}
