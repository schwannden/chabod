
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/AuthContext";
import { NavBar } from "@/components/Layout/NavBar";
import { TenantCard } from "@/components/Tenants/TenantCard";
import { TenantCreateDialog } from "@/components/Tenants/TenantCreateDialog";
import { Button } from "@/components/ui/button";
import { TenantWithUsage } from "@/lib/types";
import { getUserTenants } from "@/lib/tenant-utils";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantWithUsage[]>([]);
  const [isTenantsLoading, setIsTenantsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, redirect to auth page
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchTenants = async () => {
      if (!user) return;
      
      try {
        const tenantsData = await getUserTenants(user.id);
        setTenants(tenantsData);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      } finally {
        setIsTenantsLoading(false);
      }
    };

    if (user) {
      fetchTenants();
    }
  }, [user]);

  const handleTenantChange = async () => {
    if (!user) return;
    setIsTenantsLoading(true);
    const tenantsData = await getUserTenants(user.id);
    setTenants(tenantsData);
    setIsTenantsLoading(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">你所管理的教會</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新增教會
          </Button>
        </div>

        {isTenantsLoading ? (
          <div className="flex items-center justify-center py-12">載入教會列表...</div>
        ) : tenants.length === 0 ? (
          <div className="bg-muted rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">還沒有您所管理的教會</h3>
            <p className="text-muted-foreground mb-4">
              新增你的第一個教會來開始使用
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 新增教會
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onTenantUpdated={handleTenantChange}
                onTenantDeleted={handleTenantChange}
              />
            ))}
          </div>
        )}
      </main>

      {user && (
        <TenantCreateDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          userId={user.id}
          onTenantCreated={handleTenantChange}
        />
      )}
    </div>
  );
}
