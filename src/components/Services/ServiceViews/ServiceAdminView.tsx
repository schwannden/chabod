import { useQuery } from "@tanstack/react-query";
import { getServiceAdmins } from "@/lib/services/service-admin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function ServiceAdminView({ serviceId }: { serviceId: string }) {
  const { t } = useTranslation();
  const {
    data: admins = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["serviceAdmins", serviceId],
    queryFn: () => getServiceAdmins(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">{t("common.loading")}</div>;
  if (error)
    return (
      <div className="text-red-500">
        {t("services.loadingError")}: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      {admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">{t("services.noServiceAdmins")}</p>
          <Button variant="outline" size="sm" disabled className="opacity-50">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("services.addAdmin")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t("services.serviceAdmins")}</h3>
            <Button variant="outline" size="sm">
              {t("services.addAdmin")}
            </Button>
          </div>
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {admin.profiles?.full_name?.charAt(0) ||
                      admin.profiles?.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {admin.profiles?.full_name || t("services.anonymousMember")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {admin.profiles?.email || t("services.noEmail")}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {t("common.delete")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
