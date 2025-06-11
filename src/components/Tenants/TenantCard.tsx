import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, Copy, Info } from "lucide-react";
import { TenantWithUsage } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { deleteTenant } from "@/lib/tenant-utils";
import { TenantUpdateDialog } from "./TenantUpdateDialog";
import { PricePlansDialog } from "./PricePlansDialog";
import { HighRiskDeleteDialog } from "@/components/shared/HighRiskDeleteDialog";
import { useTranslation } from "react-i18next";

interface TenantCardProps {
  tenant: TenantWithUsage;
  onTenantUpdated: () => void;
  onTenantDeleted: () => void;
}

export function TenantCard({ tenant, onTenantUpdated, onTenantDeleted }: TenantCardProps) {
  const { t } = useTranslation();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAllPlansDialogOpen, setIsAllPlansDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTenant(tenant.id);
      toast({
        title: "Tenant deleted",
        description: `${tenant.name} has been deleted successfully.`,
      });
      onTenantDeleted();
    } catch (error) {
      toast({
        title: "Error deleting tenant",
        description: error?.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleManageTenant = () => {
    navigate(`/tenant/${tenant.slug}`);
  };

  const handleOpenTenantAuth = () => {
    navigate(`/tenant/${tenant.slug}/auth`);
  };

  const handleCopyAuthUrl = () => {
    const authUrl = `${window.location.origin}/tenant/${tenant.slug}/auth`;
    navigator.clipboard.writeText(authUrl);
    toast({
      title: t("tenant:urlCopied"),
      description: t("tenant:churchLoginUrlCopied"),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {tenant.name}
            {tenant.userRole === "owner" && (
              <div className="flex space-x-2">
                <Button size="icon" variant="outline" onClick={() => setIsUpdateDialogOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>Slug: {tenant.slug}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>
              {tenant.memberCount} {t("tenant:members")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t("tenant:created")}: {new Date(tenant.created_at).toLocaleDateString()}
          </p>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium mb-2">{t("tenant:subscriptionPlan")}</h4>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setIsAllPlansDialogOpen(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">{tenant.price_tier?.name || "Free"}</p>
              <p className="text-sm text-muted-foreground">
                ${tenant.price_tier?.price_monthly || 0}
                {t("tenant:monthlyPrice")}
              </p>
              <div className="space-y-1">
                <p className="text-xs">
                  {t("tenant:membersLimit")}: {tenant.memberCount} /{" "}
                  {tenant.price_tier?.user_limit || 0}
                </p>
                <p className="text-xs">
                  {t("tenant:groupsLimit")}: {tenant.groupCount || 0} /{" "}
                  {tenant.price_tier?.group_limit || 0}
                </p>
                <p className="text-xs">
                  {t("tenant:eventsLimit")}: {tenant.eventCount || 0} /{" "}
                  {tenant.price_tier?.event_limit || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t">
            <p className="text-sm font-medium mb-1">{t("tenant:churchLoginPageUrl")}:</p>
            <div className="flex items-center justify-between">
              <code className="text-xs bg-muted p-1 rounded break-all">
                {window.location.origin}/tenant/{tenant.slug}/auth
              </code>
              <Button size="sm" variant="ghost" onClick={handleCopyAuthUrl}>
                <Copy className="h-4 w-4 mr-1" />
                {t("tenant:copy")}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleManageTenant}>
            {t("tenant:goToChurchDashboard")}
          </Button>
          <Button onClick={handleOpenTenantAuth}>{t("tenant:goToChurchLogin")}</Button>
        </CardFooter>
      </Card>

      <TenantUpdateDialog
        tenant={tenant}
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        onTenantUpdated={onTenantUpdated}
      />

      <PricePlansDialog
        tenant={tenant}
        isOpen={isAllPlansDialogOpen}
        onOpenChange={setIsAllPlansDialogOpen}
      />

      <HighRiskDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t("tenant:deleteChurch")}
        description={t("tenant:deleteChurchConfirm", { tenantName: tenant.name })}
        confirmationText={tenant.slug}
        confirmationPlaceholder={t("tenant:enterChurchSlug")}
        isLoading={isDeleting}
      />
    </>
  );
}
