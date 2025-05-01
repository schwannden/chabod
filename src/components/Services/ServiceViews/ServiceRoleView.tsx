
import { useQuery } from "@tanstack/react-query";
import { getServiceRoles } from "@/lib/services/service-roles";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ServiceRoleView({ serviceId }: { serviceId: string }) {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ["serviceRoles", serviceId],
    queryFn: () => getServiceRoles(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">尚未添加服事角色</p>
          <Button variant="outline" size="sm" disabled className="opacity-50">
            <PlusCircle className="mr-2 h-4 w-4" />
            添加角色
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
                  <div className="font-medium text-left">
                    {role.name}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <span>創建於: {new Date(role.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="px-3 py-1">
                    {role.name}
                  </Badge>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  ID: {role.id.substring(0, 8)}...
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
