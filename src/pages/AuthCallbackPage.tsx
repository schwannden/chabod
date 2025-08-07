import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useTranslation } from "react-i18next";
import { NavBar } from "@/components/Layout/NavBar";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const { t } = useTranslation(["auth", "common"]);
  const { session, user, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Check for error parameters immediately to avoid showing loading state
  const hasErrorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [isProcessing, setIsProcessing] = useState(!hasErrorParam);
  const [error, setError] = useState<string | null>(
    hasErrorParam ? errorDescription || hasErrorParam : null,
  );

  useEffect(() => {
    // If we already have an error from URL parameters, don't process further
    if (hasErrorParam) {
      console.error("OAuth callback error:", errorDescription || hasErrorParam);
      return;
    }

    // PATTERN: Supabase automatically processes OAuth tokens from URL fragments
    // onAuthStateChange in SessionProvider will detect successful authentication

    const handleOAuthCallback = async () => {
      try {
        // PATTERN: Wait for session to be established
        // SessionProvider handles onAuthStateChange automatically

        // CRITICAL: Handle redirect after auth success
        // Check for invite tokens, redirect to appropriate page
        const inviteToken = searchParams.get("inviteToken");

        if (inviteToken) {
          // Handle tenant invitation flow
          navigate(`/tenant/auth?invite=${inviteToken}`, { replace: true });
        } else {
          // Redirect to dashboard or original destination
          const redirectPath = sessionStorage.getItem("redirectPath") || "/dashboard";
          sessionStorage.removeItem("redirectPath");
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setError(error instanceof Error ? error.message : t("auth:unknownError"));
        setIsProcessing(false);
      }
    };

    let timeout: NodeJS.Timeout | undefined;

    // Wait for session state to stabilize before processing
    if (!sessionLoading) {
      // If we have a session/user, process the callback
      if (session || user) {
        handleOAuthCallback();
      } else {
        // No session after OAuth - something went wrong
        // Wait a bit longer for auth state to update
        timeout = setTimeout(() => {
          setError(t("auth:authenticationFailed"));
          setIsProcessing(false);
        }, 3000); // Wait up to 3 seconds for auth state
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [session, user, sessionLoading, searchParams, navigate, t, hasErrorParam, errorDescription]);

  // Update processing state when session changes
  useEffect(() => {
    if (session && isProcessing) {
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  // Show loading state while processing OAuth callback
  if (isProcessing || sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" data-testid="loading-spinner" />
            <h2 className="text-lg font-semibold mb-2">{t("auth:completingAuthentication")}</h2>
            <p className="text-muted-foreground">{t("common:processing")}</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-destructive mb-4">
              <svg
                className="h-12 w-12 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">{t("auth:authenticationFailed")}</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {t("auth:tryAgain")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Should not reach here - component redirects before rendering
  return null;
}
