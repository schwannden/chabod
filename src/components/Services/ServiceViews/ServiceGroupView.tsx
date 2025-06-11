import { useQuery } from "@tanstack/react-query";
import { getGroupsForServiceWithNames } from "@/lib/services/service-groups";
import { PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function ServiceGroupView({ serviceId }: { serviceId: string }) {
  const { t } = useTranslation("services");
  const {
    data: groups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["serviceGroups", serviceId],
    queryFn: () => getGroupsForServiceWithNames(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">{t("common:loading")}</div>;
  if (error) return <div className="text-red-500">{t("loadingError")}</div>;

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">{t("noServiceGroups")}</p>
          <Button variant="outline" size="sm" disabled className="opacity-50">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("addGroup")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t("serviceGroups")}</h3>
            <Button variant="outline" size="sm" disabled className="opacity-50">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("addGroup")}
            </Button>
          </div>
          {groups.map((group, index) => (
            <div
              key={`group-${index}-${group.id}`}
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
            >
              <div className="bg-primary/10 p-2 rounded-md">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{group.name || t("unnamedGroup")}</div>
                <div className="text-sm text-muted-foreground">
                  {group.description || t("noDescription")}
                </div>
              </div>
              <Button variant="outline" size="sm">
                {t("common:delete")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
