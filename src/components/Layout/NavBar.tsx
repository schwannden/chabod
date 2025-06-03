import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function NavBar() {
  const { user } = useSession();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: t("auth.loggedOut"),
        description: t("auth.loggedOutSuccess"),
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: t("auth.logoutError"),
        description: t("auth.logoutError"),
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-primary">
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
                    {t("nav.dashboard")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/profile">{t("nav.profile")}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.logout")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to={`/auth${location.pathname !== "/" ? `?redirect=${encodeURIComponent(location.pathname)}` : ""}`}
                  >
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth?tab=signup">{t("nav.signup")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
