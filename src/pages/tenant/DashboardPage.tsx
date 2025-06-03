
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { NavBar } from "@/components/Layout/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tenant } from "@/lib/types";
import { getTenantBySlug, getTenants } from "@/lib/tenant-utils";
import { Loader2, Users, Calendar, Group, FileText, Handshake } from "lucide-react";

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, isLoading, signOut } = useSession();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isLoading, navigate, slug]);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug || !user) return;

      try {
        // Check if user is a member of this tenant first
        const userTenants = await getTenants();
        const currentTenant = userTenants.find((t) => t.slug === slug);

        if (!currentTenant) {
          navigate(`/tenant/${slug}/auth`);
          return;
        }

        // User is a member, now fetch the complete tenant data
        const tenantData = await getTenantBySlug(slug);

        if (!tenantData) {
          console.error("Tenant not found");
          navigate("/not-found");
          return;
        }

        setTenant(tenantData);
      } catch (error) {
        console.error("Error fetching tenant:", error);
      } finally {
        setIsTenantLoading(false);
      }
    };

    fetchTenant();
  }, [slug, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    // navigate to tenant's auth page
    navigate(`/tenant/${slug}/auth`);
  };

  const organizationCards = [
    {
      title: "會友",
      icon: Users,
      description: "管理您的教會會友",
      link: `/tenant/${tenant?.slug}/members`,
    },
    {
      title: "群組",
      icon: Group,
      description: "將您的教會組織成群組",
      link: `/tenant/${tenant?.slug}/groups`,
    },
  ];

  const utilityCards = [
    {
      title: "活動",
      icon: Calendar,
      description: "安排和管理活動",
      link: `/tenant/${tenant?.slug}/events`,
    },
    {
      title: "資源",
      icon: FileText,
      description: "管理資源超連結",
      link: `/tenant/${tenant?.slug}/resources`,
    },
    {
      title: "服事管理",
      icon: Handshake,
      description: "創建管理服事類型",
      link: `/tenant/${tenant?.slug}/services`,
    },
    {
      title: "服事表",
      icon: Calendar,
      description: "各組服事表",
      link: `/tenant/${tenant?.slug}/service_events`,
    },
  ];

  if (isLoading || isTenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">載入中...</span>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">教會不存在</h1>
            <p className="mb-6">教會 "{slug}" 不存在或已被刪除。</p>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">
              返回首頁
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{tenant?.name} 首頁</h1>
          <p className="text-muted-foreground">歡迎, {profile?.full_name || "用戶"}</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">組織管理</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organizationCards.map((card) => (
                <Card
                  key={card.title}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(card.link)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-semibold">{card.title}</CardTitle>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">工具</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {utilityCards.map((card) => (
                <Card
                  key={card.title}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(card.link)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-semibold">{card.title}</CardTitle>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
