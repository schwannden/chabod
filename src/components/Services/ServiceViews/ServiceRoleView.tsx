
import { useQuery } from "@tanstack/react-query";
import { getServiceRoles } from "@/lib/services/service-roles";
import { Badge } from "@/components/ui/badge";

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
        <p className="text-muted-foreground text-center">尚未添加服事角色</p>
      ) : (
        <div className="space-y-3">
          {roles.map((role, index) => (
            <div key={role.id || index} className="border rounded-md p-3">
              <Badge variant="outline">{role.name}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
