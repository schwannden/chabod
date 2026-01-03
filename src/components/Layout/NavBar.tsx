import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function NavBar() {
  const { t } = useTranslation(["nav", "auth"]);
  const { user } = useSession();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: t("auth:loggedOut"),
        description: t("auth:loggedOutSuccess"),
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: t("auth:logoutError"),
        description: t("auth:logoutError"),
        variant: "destructive",
      });
    }
  };

  // Dynamic logo destination logic
  const getLogoDestination = () => {
    const currentPath = location.pathname;

    // If on tenant paths, go to tenant dashboard
    const tenantMatch = currentPath.match(/^\/tenant\/([^/]+)/);
    if (tenantMatch) {
      const slug = tenantMatch[1];
      return `/tenant/${slug}`;
    }

    // If on profile page (but not tenant profile), go to dashboard
    if (currentPath === "/profile") {
      return "/dashboard";
    }

    // For all other paths (including "/" and "/dashboard"), go to "/"
    return "/";
  };

  // Dynamic profile destination logic
  const getProfileDestination = () => {
    const currentPath = location.pathname;

    // If on tenant paths, go to tenant profile
    const tenantMatch = currentPath.match(/^\/tenant\/([^/]+)/);
    if (tenantMatch) {
      const slug = tenantMatch[1];
      return `/tenant/${slug}/profile`;
    }

    // For all other paths, go to /profile
    return "/profile";
  };

  // Dynamic auth destination logic
  const getAuthDestination = (isSignup: boolean = false) => {
    const currentPath = location.pathname;

    // If on tenant paths, go to tenant auth
    const tenantMatch = currentPath.match(/^\/tenant\/([^/]+)/);
    if (tenantMatch) {
      const slug = tenantMatch[1];
      // Build redirect URL to return user to original page
      const redirectParam =
        currentPath !== `/tenant/${slug}` && currentPath !== `/tenant/${slug}/auth`
          ? `?redirect=${encodeURIComponent(currentPath)}`
          : "";
      const tabParam = isSignup ? `${redirectParam ? "&" : "?"}tab=signup` : "";
      return `/tenant/${slug}/auth${redirectParam}${tabParam}`;
    }

    // For all other paths, go to global auth
    const redirectParam =
      currentPath !== "/" && !currentPath.startsWith("/auth") && currentPath !== "/dashboard"
        ? `?redirect=${encodeURIComponent(currentPath)}`
        : "";
    const tabParam = isSignup ? `${redirectParam ? "&" : "?"}tab=signup` : "";
    return `/auth${redirectParam}${tabParam}`;
  };

  // Check if we're on an auth page (main auth or tenant auth)
  const isOnAuthPage = () => {
    const currentPath = location.pathname;
    // Main auth page
    if (currentPath === "/auth") {
      return true;
    }
    // Tenant auth pages: /tenant/{slug}/auth
    if (currentPath.match(/^\/tenant\/[^/]+\/auth$/)) {
      return true;
    }
    return false;
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to={getLogoDestination()} className="text-xl font-bold text-primary">
              Chabod
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    {t("dashboard")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={getProfileDestination()}>{t("profile")}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout")}
                </Button>
              </div>
            ) : (
              // Only show login/register buttons if not on auth pages
              !isOnAuthPage() && (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={getAuthDestination(false)}>{t("login")}</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={getAuthDestination(true)}>{t("signup")}</Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
