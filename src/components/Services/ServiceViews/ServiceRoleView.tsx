
import { useQuery } from "@tanstack/react-query";
import { getServiceRoles } from "@/lib/services/service-roles";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-3">
          {roles.map((role, index) => (
            <div 
              key={role.id || index} 
              className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="px-3 py-1">
                  {role.name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {role.id.substring(0, 8)}...
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                新增時間: {new Date(role.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
