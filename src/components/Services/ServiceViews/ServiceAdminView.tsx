
import { useQuery } from "@tanstack/react-query";
import { getServiceAdminsWithProfiles } from "@/lib/services/service-admin";

export function ServiceAdminView({ serviceId }: { serviceId: string }) {
  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ["serviceAdmins", serviceId],
    queryFn: () => getServiceAdminsWithProfiles(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;
  
  return (
    <div className="space-y-4">
      {admins.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未指定服事管理員</p>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-2 p-2 rounded-md border">
              <div className="flex-1">
                <div className="font-medium">{admin.profile?.name || admin.user_email}</div>
                <div className="text-sm text-muted-foreground">{admin.user_email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
