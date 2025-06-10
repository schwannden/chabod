
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TenantAuthFlow } from "@/components/Auth/TenantAuthFlow";
import { NavBar } from "@/components/Layout/NavBar";
import { useSession } from "@/hooks/useSession";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { Tenant } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { checkUserTenantAccess } from "@/lib/member-service";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setInviteToken(token);
    }
  }, []);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;

      try {
        const tenantData = await getTenantBySlug(slug);
        if (tenantData) {
          setTenant(tenantData);
          setError(null);
        } else {
          setError(t("common.tenantNotFoundDesc", { slug }));
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
        setError(t("common.unknownError"));
      } finally {
        setIsTenantLoading(false);
      }
    };

    fetchTenant();
  }, [slug, t]);

  useEffect(() => {
    const checkUserMembership = async () => {
      if (!isLoading && user && tenant && slug) {
        try {
          const hasAccess = await checkUserTenantAccess(user.id, slug);

          if (hasAccess) {
            navigate(`/tenant/${slug}`);
          } else if (!inviteToken) {
            console.log("User is not a member of this tenant and has no invite token");
          }
        } catch (error) {
          console.error("Error checking tenant membership:", error);
        }
      }
    };

    checkUserMembership();
  }, [user, isLoading, navigate, tenant, slug, inviteToken]);

  const handleAuthSuccess = () => {
    navigate(`/tenant/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">{t("common.loading")}</div>
    );
  }

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{t("common.tenantNotFound")}</h1>
            <p className="mb-6">{error}</p>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">
              {t("common.returnHome")}
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
        <div className="max-w-md mx-auto mt-8">
          {tenant && (
            <>
              <h1 className="text-3xl font-bold text-center mb-8">{t("auth.welcomeToChurch", { tenantName: tenant.name })}</h1>
              <TenantAuthFlow
                tenantSlug={tenant.slug}
                tenantName={tenant.name}
                inviteToken={inviteToken || undefined}
                onSuccess={handleAuthSuccess}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
