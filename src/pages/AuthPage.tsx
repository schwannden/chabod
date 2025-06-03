
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthTabs } from "@/components/Auth/AuthTabs";
import { NavBar } from "@/components/Layout/NavBar";
import { useSession } from "@/hooks/useSession";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && user) {
      // User is already logged in, redirect to dashboard
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-8">
          <h1 className="text-3xl font-bold text-center mb-8">{t('auth.welcome')}</h1>
          <AuthTabs onSuccess={handleAuthSuccess} initialTab={initialTab} />
        </div>
      </main>
    </div>
  );
}
