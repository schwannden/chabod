import { useQuery } from "@tanstack/react-query";
import { getServiceAdmins } from "@/lib/services/service-admin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ServiceAdminView({ serviceId }: { serviceId: string }) {
  const {
    data: admins = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["serviceAdmins", serviceId],
    queryFn: () => getServiceAdmins(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗: {(error as Error).message}</div>;

  return (
    <div className="space-y-4">
      {admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">尚未指定服事管理員</p>
          <Button variant="outline" size="sm" disabled className="opacity-50">
            <UserPlus className="mr-2 h-4 w-4" />
            添加管理員
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {admin.profiles?.full_name?.substring(0, 2) ||
                    admin.profiles?.email?.substring(0, 2) || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{admin.profiles?.full_name || "匿名成員"}</div>
                <div className="text-sm text-muted-foreground">
                  {admin.profiles?.email || "無電子郵件"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
