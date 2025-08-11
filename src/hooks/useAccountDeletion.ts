import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import {
  checkAccountDeletionEligibility,
  initiateAccountDeletion,
  deleteAccount,
} from "@/lib/services/account-deletion-service";
import type { AccountDeletionValidation } from "@/lib/types";

interface UseAccountDeletionReturn {
  // State
  isLoading: boolean;
  isChecking: boolean;
  eligibility: AccountDeletionValidation | null;

  // Actions
  checkEligibility: () => Promise<AccountDeletionValidation>;
  initiateDeletion: (email: string) => Promise<{ requiresConfirmation: boolean }>;
  confirmDeletion: () => Promise<void>;

  // Utility
  reset: () => void;
}

export function useAccountDeletion(): UseAccountDeletionReturn {
  const { t } = useTranslation("profile");
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [eligibility, setEligibility] = useState<AccountDeletionValidation | null>(null);

  const checkEligibility = useCallback(async (): Promise<AccountDeletionValidation> => {
    setIsChecking(true);
    try {
      const result = await checkAccountDeletionEligibility();
      setEligibility(result);

      if (!result.canDelete && result.blockers.length > 0) {
        // Show helpful message about blockers
        const blockerMessages = result.blockers.map((blocker) => {
          if (blocker.type === "sole_tenant_owner") {
            return t("deleteAccount.blockerSoleTenantOwner", { tenantName: blocker.tenantName });
          }
          return t("deleteAccount.blockerUnknown", { type: blocker.type });
        });

        toast({
          title: t("deleteAccount.cannotDelete"),
          description: blockerMessages.join("\n"),
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error("Error checking account deletion eligibility:", error);
      toast({
        title: t("deleteAccount.checkEligibilityError"),
        description:
          error instanceof Error ? error.message : t("deleteAccount.checkEligibilityErrorDesc"),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, [t, toast]);

  const initiateDeletion = useCallback(
    async (email: string) => {
      setIsLoading(true);
      try {
        const result = await initiateAccountDeletion(email);

        if (!result.requiresConfirmation && result.blockers) {
          // Show blocker messages
          const blockerMessages = result.blockers.map((blocker) => {
            if (blocker.type === "sole_tenant_owner") {
              return t("deleteAccount.blockerSoleTenantOwner", { tenantName: blocker.tenantName });
            }
            return t("deleteAccount.blockerUnknown", { type: blocker.type });
          });

          toast({
            title: t("deleteAccount.cannotDelete"),
            description: blockerMessages.join("\n"),
            variant: "destructive",
          });

          return result;
        }

        // No token creation needed anymore - ready for confirmation dialog
        return result;
      } catch (error) {
        console.error("Error initiating account deletion:", error);
        toast({
          title: t("deleteAccount.initiationError"),
          description:
            error instanceof Error ? error.message : t("deleteAccount.initiationErrorDesc"),
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [t, toast],
  );

  const confirmDeletion = useCallback(async () => {
    setIsLoading(true);
    try {
      await deleteAccount();

      toast({
        title: t("deleteAccount.success"),
        description: t("deleteAccount.successDesc"),
      });

      // Note: User sign-out is now handled within the deleteAccount service function
      // Redirect will happen automatically when session context detects no user
    } catch (error) {
      console.error("Error confirming account deletion:", error);

      let errorMessage = t("deleteAccount.confirmationErrorDesc");

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes("sole owner")) {
          errorMessage = t("deleteAccount.soleOwnerError");
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: t("deleteAccount.confirmationError"),
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsChecking(false);
    setEligibility(null);
  }, []);

  return {
    isLoading,
    isChecking,
    eligibility,
    checkEligibility,
    initiateDeletion,
    confirmDeletion,
    reset,
  };
}
