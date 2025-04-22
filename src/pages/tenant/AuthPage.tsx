import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthTabs } from "@/components/Auth/AuthTabs";
import { NavBar } from "@/components/Layout/NavBar";
import { useSession } from "@/contexts/AuthContext";
import { getTenantBySlug, checkTenantMembership } from "@/lib/tenant-utils";
import { Tenant } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { checkUserTenantAccess } from "@/lib/member-service";

export default function AuthPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setInviteToken(token);
    }
  }, []);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      
      try {
        console.log("Fetching tenant with slug:", slug);
        const tenantData = await getTenantBySlug(slug);
        console.log("Tenant data received:", tenantData);
        
        if (tenantData) {
          setTenant(tenantData);
          setError(null);
        } else {
          setError(`The tenant "${slug}" does not exist or has been deleted.`);
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
        setError(`Failed to load tenant information. Please try again later.`);
      } finally {
        setIsTenantLoading(false);
      }
    };

    fetchTenant();
  }, [slug]);

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

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Tenant Not Found</h1>
            <p className="mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Return to home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar tenant={tenant ? { name: tenant.name, slug: tenant.slug } : undefined} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-8">
          {tenant && (
            <>
              <h1 className="text-3xl font-bold text-center mb-8">歡迎來到 {tenant.name}</h1>
              <AuthTabs 
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
