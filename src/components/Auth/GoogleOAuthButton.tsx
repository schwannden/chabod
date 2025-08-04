import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Chrome, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  inviteToken?: string;
}

export function GoogleOAuthButton({
  onSuccess: _onSuccess,
  onError,
  inviteToken,
}: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation("auth");
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Include invite token in redirect URL for tenant flows
      const redirectTo = inviteToken
        ? `${window.location.origin}/auth/callback?inviteToken=${inviteToken}`
        : `${window.location.origin}/auth/callback`;

      const { data: _data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;

      // Success handled by redirect - onSuccess called in callback
    } catch (error: unknown) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : t("unknownError");

      onError?.(errorMessage);
      toast({
        title: t("loginFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Chrome className="mr-2 h-4 w-4" />
      )}
      {isLoading ? t("signingInWithGoogle") : t("continueWithGoogle")}
    </Button>
  );
}
