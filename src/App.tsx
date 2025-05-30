import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
// Alternative: import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SessionProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
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

export default function App() {
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
