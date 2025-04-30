
import { useQuery } from "@tanstack/react-query";
import { getGroupsForService } from "@/lib/services/service-groups";

export function ServiceGroupView({ serviceId }: { serviceId: string }) {
  const { data: groupIds = [], isLoading, error } = useQuery({
    queryKey: ["serviceGroups", serviceId],
    queryFn: () => getGroupsForService(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {groupIds.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未指定服事小組</p>
      ) : (
        <div className="space-y-2">
          {groupIds.map((groupId, index) => (
            <div key={`group-${index}-${groupId}`} className="flex items-center gap-2 p-2 rounded-md border">
              <div className="font-medium">{groupId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
