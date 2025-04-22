import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, Copy, ExternalLink } from "lucide-react";
import { TenantWithMemberCount } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { deleteTenant } from "@/lib/tenant-utils";
import { TenantUpdateDialog } from "./TenantUpdateDialog";

interface TenantCardProps {
  tenant: TenantWithMemberCount & {
    price_tier?: {
      name: string;
      price_monthly: number;
      user_limit: number;
      group_limit: number;
      event_limit: number;
    };
    groupCount?: number;
    eventCount?: number;
  };
  onTenantUpdated: () => void;
  onTenantDeleted: () => void;
}

export function TenantCard({ tenant, onTenantUpdated, onTenantDeleted }: TenantCardProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTenant(tenant.id);
      toast({
        title: "Tenant deleted",
        description: `${tenant.name} has been deleted successfully.`,
      });
      onTenantDeleted();
    } catch (error: any) {
      toast({
        title: "Error deleting tenant",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
      title: "URL copied to clipboard",
      description: "The tenant auth URL has been copied to your clipboard.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {tenant.name}
            <div className="flex space-x-2">
              <Button size="icon" variant="outline" onClick={() => setIsUpdateDialogOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Slug: {tenant.slug}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{tenant.memberCount} members</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Created: {new Date(tenant.created_at).toLocaleDateString()}
          </p>
          
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Pricing Plan</h4>
            <div className="space-y-2">
              <p className="text-sm font-semibold">{tenant.price_tier?.name || 'Free'}</p>
              <p className="text-sm text-muted-foreground">
                ${tenant.price_tier?.price_monthly || 0}/month
              </p>
              <div className="space-y-1">
                <p className="text-xs">
                  Members: {tenant.memberCount} / {tenant.price_tier?.user_limit || 0}
                </p>
                <p className="text-xs">
                  Groups: {tenant.groupCount || 0} / {tenant.price_tier?.group_limit || 0}
                </p>
                <p className="text-xs">
                  Events: {tenant.eventCount || 0} / {tenant.price_tier?.event_limit || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t">
            <p className="text-sm font-medium mb-1">Auth Page URL:</p>
            <div className="flex items-center justify-between">
              <code className="text-xs bg-muted p-1 rounded break-all">
                {window.location.origin}/tenant/{tenant.slug}/auth
              </code>
              <Button size="sm" variant="ghost" onClick={handleCopyAuthUrl}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleManageTenant}>
            前往教會首頁
          </Button>
          <Button onClick={handleOpenTenantAuth}>
            前往教會登入頁面
          </Button>
        </CardFooter>
      </Card>
      
      <TenantUpdateDialog
        tenant={tenant}
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        onTenantUpdated={onTenantUpdated}
      />
    </>
  );
}
