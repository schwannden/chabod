import { useQuery } from "@tanstack/react-query";
import { getServiceRoles } from "@/lib/services/service-roles";
import { PlusCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export function ServiceRoleView({ serviceId }: { serviceId: string }) {
  const { t } = useTranslation("services");

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["serviceRoles", serviceId],
    queryFn: () => getServiceRoles(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">{t("loading")}</div>;
  if (error) return <div className="text-red-500">{t("loadingFailed")}</div>;

  return (
    <div className="space-y-4">
      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">{t("noServiceRolesAdded")}</p>
          <Button variant="outline" size="sm" disabled className="opacity-50">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("addRoles")}
          </Button>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {roles.map((role, index) => (
            <AccordionItem key={role.id || index} value={role.id || `role-${index}`}>
              <AccordionTrigger className="hover:no-underline px-3 py-2 group">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="font-medium text-left">{role.name}</div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <span>
                    {t("createdAt")}: {new Date(role.created_at).toLocaleString()}
                  </span>
                </div>
                {/* Only show description if it exists */}
                {role.description && (
                  <p className="whitespace-pre-wrap mb-2 mt-4 text-sm">{role.description}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
