import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthTabs } from "@/components/Auth/AuthTabs";
import { NavBar } from "@/components/Layout/NavBar";
import { useSession } from "@/hooks/useSession";

export default function AuthPage() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // User is already logged in, redirect to dashboard
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const handleAuthSuccess = () => {
    navigate("/");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-8">
          <h1 className="text-3xl font-bold text-center mb-8">歡迎使用 Chabod 教會管理系統</h1>
          <AuthTabs onSuccess={handleAuthSuccess} />
        </div>
      </main>
    </div>
  );
}
