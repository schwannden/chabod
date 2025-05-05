import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { NavBar } from "@/components/Layout/NavBar";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { ProfileForm } from "@/components/Profile/ProfileForm";
import { Tenant, Profile } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile: sessionProfile, isLoading } = useSession();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(slug ? true : false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(slug ? `/tenant/${slug}/auth` : "/auth");
    }
  }, [user, isLoading, navigate, slug]);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;

      try {
        const tenantData = await getTenantBySlug(slug);
        setTenant(tenantData);
      } catch (error) {
        console.error("Error fetching tenant:", error);
      } finally {
        setIsTenantLoading(false);
      }
    };

    if (slug) {
      fetchTenant();
    }
  }, [slug]);

  useEffect(() => {
    if (sessionProfile) {
      setCurrentProfile(sessionProfile);
    }
  }, [sessionProfile]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setCurrentProfile(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const handleProfileUpdated = () => {
    fetchProfileData();
  };

  if (isLoading || (slug && isTenantLoading)) {
    return <div className="flex items-center justify-center min-h-screen">載入中...</div>;
  }

  if (slug && !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">找不到租戶</h1>
            <p className="mb-6">租戶 "{slug}" 不存在或已被刪除。</p>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">
              返回首頁
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!currentProfile) {
    return <div className="flex items-center justify-center min-h-screen">找不到個人資料</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar tenant={tenant ? { name: tenant.name, slug: tenant.slug } : undefined} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">你的個人資料</h1>
          <p className="text-muted-foreground">更新你的個人資訊</p>
        </div>

        <ProfileForm profile={currentProfile} onProfileUpdated={handleProfileUpdated} />
      </main>
    </div>
  );
}
