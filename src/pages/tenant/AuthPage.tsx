import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { TenantAuthFlow } from "@/components/Auth/TenantAuthFlow";
import { NavBar } from "@/components/Layout/NavBar";
import { useSession } from "@/hooks/useSession";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { Tenant } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { checkUserTenantAccess } from "@/lib/member-service";
import { associateUserWithTenant } from "@/lib/membership-service";
import { useTranslation } from "react-i18next";
import { AuthFlowStep } from "@/hooks/useTenantAuthFlow";
import { useToast } from "@/hooks/use-toast";
import { useInvalidateTenants } from "@/hooks/useTenants";

export default function AuthPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAssociating, setIsAssociating] = useState(false);
  const [hasAttemptedAssociation, setHasAttemptedAssociation] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const invalidateTenants = useInvalidateTenants();

  // Get the flow step from URL query parameter
  const flowStep = searchParams.get("flow") as AuthFlowStep | null;
  const prefilledEmail = searchParams.get("email");
  const redirectTo = searchParams.get("redirect");

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
          setError(t("common:tenantNotFoundDesc", { slug }));
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
        setError(t("common:unknownError"));
      } finally {
        setIsTenantLoading(false);
      }
    };

    fetchTenant();
  }, [slug, t]);

  // Auto-associate OAuth users with tenant when they complete signup/join flow
  useEffect(() => {
    const autoAssociateOAuthUser = async () => {
      // Guard conditions
      if (!user || !tenant || !flowStep || isLoading || isTenantLoading) return;
      if (flowStep !== "signup" && flowStep !== "join-signin") return;
      if (inviteToken) return; // Invite flow handles its own association
      if (hasAttemptedAssociation) return; // Prevent double-association

      // Check if user already has access
      const hasAccess = await checkUserTenantAccess(user.id, slug!);
      if (hasAccess) return; // Already a member

      // Associate user with tenant
      setIsAssociating(true);
      try {
        await associateUserWithTenant(user.id, tenant.id);
        setHasAttemptedAssociation(true);
        invalidateTenants();

        toast({
          title: t("auth:joinedChurch"),
          description: t("auth:joinedChurchDesc", { tenantName: tenant.name }),
        });
      } catch (error) {
        console.error("Auto-association error:", error);
        setError(error instanceof Error ? error.message : t("auth:cannotJoinChurch"));
      } finally {
        setIsAssociating(false);
      }
    };

    autoAssociateOAuthUser();
  }, [
    user,
    tenant,
    flowStep,
    isLoading,
    isTenantLoading,
    slug,
    inviteToken,
    hasAttemptedAssociation,
    t,
    toast,
    invalidateTenants,
  ]);

  useEffect(() => {
    const checkUserMembership = async () => {
      if (!isLoading && user && tenant && slug) {
        try {
          const isJoinFlow = flowStep === "signup" || flowStep === "join-signin";

          // Prevent premature "no permission" during OAuth auto-join
          if (!inviteToken && isJoinFlow) {
            if (isAssociating) return;
            // Wait for the auto-join attempt to complete before deciding access
            if (!hasAttemptedAssociation) return;
          }

          // Optional reliability: retry a few times after join attempt to smooth out timing
          let hasAccess = false;
          const maxAttempts = !inviteToken && isJoinFlow && hasAttemptedAssociation ? 5 : 1;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            hasAccess = await checkUserTenantAccess(user.id, slug);
            if (hasAccess) break;
            if (attempt < maxAttempts - 1) {
              await new Promise((resolve) => setTimeout(resolve, 250));
            }
          }

          if (hasAccess) {
            // Redirect to original page if specified
            if (redirectTo && redirectTo.startsWith(`/tenant/${slug}`)) {
              navigate(redirectTo);
            } else {
              navigate(`/tenant/${slug}`);
            }
          } else if (!inviteToken && !(isJoinFlow && !hasAttemptedAssociation)) {
            // ADD: User-facing error message instead of console.log
            setError(t("auth:noPermissionToEnterChurch"));
            toast({
              title: t("auth:loginFailed"),
              description: t("auth:noPermissionToEnterChurch"),
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error checking tenant membership:", error);
        }
      }
    };

    checkUserMembership();
  }, [
    user,
    isLoading,
    navigate,
    tenant,
    slug,
    inviteToken,
    redirectTo,
    t,
    toast,
    flowStep,
    isAssociating,
    hasAttemptedAssociation,
  ]);

  const handleAuthSuccess = () => {
    // If redirect parameter exists and is a valid tenant path, use it
    if (redirectTo && redirectTo.startsWith(`/tenant/${slug}`)) {
      navigate(redirectTo);
    } else {
      // Default to tenant dashboard
      navigate(`/tenant/${slug}`);
    }
  };

  const handleFlowChange = (step: AuthFlowStep, email?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (step === "welcome") {
      newSearchParams.delete("flow");
      newSearchParams.delete("email");
    } else {
      newSearchParams.set("flow", step);
      if (email) {
        newSearchParams.set("email", email);
      } else if (!email && newSearchParams.has("email")) {
        newSearchParams.delete("email");
      }
    }

    // Keep existing parameters like token
    const newUrl = `${location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
    navigate(newUrl, { replace: true });
  };

  if (isLoading || isTenantLoading || isAssociating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">
          {isAssociating ? t("auth:joiningChurch") : t("common:loading")}
        </span>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{t("common:tenantNotFound")}</h1>
            <p className="mb-6">{error}</p>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">
              {t("common:returnHome")}
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
          {error && tenant && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          {tenant && (
            <>
              <h1 className="text-3xl font-bold text-center mb-8">
                {t("auth:welcomeToChurch", { tenantName: tenant.name })}
              </h1>
              <TenantAuthFlow
                tenantSlug={tenant.slug}
                tenantName={tenant.name}
                inviteToken={inviteToken || undefined}
                onSuccess={handleAuthSuccess}
                initialStep={flowStep || "welcome"}
                prefilledEmail={prefilledEmail || undefined}
                onFlowChange={handleFlowChange}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
