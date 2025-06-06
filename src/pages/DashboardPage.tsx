import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "@/hooks/useSession";
import { useTenants } from "@/hooks/useTenants";
import { useAlphaWarning } from "@/hooks/useAlphaWarning";
import { NavBar } from "@/components/Layout/NavBar";
import { TenantCard } from "@/components/Tenants/TenantCard";
import { TenantCreateDialog } from "@/components/Tenants/TenantCreateDialog";
import { AlphaWarningDialog } from "@/components/shared/AlphaWarningDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Use the custom hook for tenant data management
  const {
    tenants,
    isLoading: isTenantsLoading,
    error: tenantsError,
    invalidateTenants,
  } = useTenants();

  // Use the alpha warning hook
  const { isOpen: isAlphaWarningOpen, dismissWarning } = useAlphaWarning();

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, redirect to auth page
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">{t("common.loading")}</div>
    );
  }

  if (tenantsError) {
    console.error("Error fetching tenants:", tenantsError);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("dashboard.churchesYouManage")}</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("dashboard.addChurch")}
          </Button>
        </div>

        {isTenantsLoading ? (
          <div className="flex items-center justify-center py-12">
            {t("dashboard.loadingChurchesList")}
          </div>
        ) : tenants.length === 0 ? (
          <div className="bg-muted rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">{t("dashboard.noChurchesYet")}</h3>
            <p className="text-muted-foreground mb-4">{t("dashboard.addFirstChurch")}</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t("dashboard.addChurch")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onTenantUpdated={invalidateTenants}
                onTenantDeleted={invalidateTenants}
              />
            ))}
          </div>
        )}
      </main>

      {user && (
        <TenantCreateDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          userId={user.id}
          onTenantCreated={invalidateTenants}
        />
      )}

      <AlphaWarningDialog isOpen={isAlphaWarningOpen} onDismiss={dismissWarning} />
    </div>
  );
}
