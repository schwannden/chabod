
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
// Alternative: import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SessionProvider } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import TenantDashboard from "./pages/tenant/DashboardPage";
import TenantAuth from "./pages/tenant/AuthPage";
import MembersPage from "./pages/tenant/MembersPage";
import GroupsPage from "./pages/tenant/GroupsPage";
import GroupMembersPage from "./pages/tenant/GroupMembersPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import EventPage from "./pages/tenant/EventPage";
import ResourcePage from "./pages/tenant/ResourcePage";
import ServicePage from "./pages/tenant/ServicePage";
import ServiceEventPage from "./pages/tenant/ServiceEventPage";

// Import i18n configuration
import { i18nPromise } from "./lib/i18n";

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle redirect from 404.html
    const redirectPath = sessionStorage.getItem("redirectPath");
    if (redirectPath) {
      sessionStorage.removeItem("redirectPath");
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      {/* Root routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Tenant routes */}
      <Route path="/tenant/:slug" element={<TenantDashboard />} />
      <Route path="/tenant/:slug/auth" element={<TenantAuth />} />
      <Route path="/tenant/:slug/members" element={<MembersPage />} />
      <Route path="/tenant/:slug/groups" element={<GroupsPage />} />
      <Route path="/tenant/:slug/events" element={<EventPage />} />
      <Route path="/tenant/:slug/groups/:groupId" element={<GroupMembersPage />} />
      <Route path="/tenant/:slug/profile" element={<ProfilePage />} />
      <Route path="/tenant/:slug/resources" element={<ResourcePage />} />
      <Route path="/tenant/:slug/services" element={<ServicePage />} />
      <Route path="/tenant/:slug/service_events" element={<ServiceEventPage />} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>載入中...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    i18nPromise.then(() => {
      setIsI18nReady(true);
    });
  }, []);

  if (!isI18nReady) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Alternative for GitHub Pages: <HashRouter> */}
            <AppRoutes />
          </BrowserRouter>
          {/* Alternative for GitHub Pages: </HashRouter> */}
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
