import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/membership-service";
import { checkUserTenantAccess } from "@/lib/member-service";
import { AuthEmailInput } from "./AuthEmailInput";
import { AuthPasswordInput } from "./AuthPasswordInput";
import { useTranslation } from "react-i18next";

interface SignInFormProps {
  tenantSlug?: string;
  tenantName?: string;
  inviteToken?: string;
  onSuccess?: () => void;
  onSignUpClick: () => void;
}

export function SignInForm({
  tenantSlug,
  tenantName,
  inviteToken,
  onSuccess,
  onSignUpClick,
}: SignInFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure email is trimmed before submitting
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({
        title: t("auth.loginFailed"),
        description: t("auth.emailEmpty"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        let errorMessage = t("auth.emailOrPasswordIncorrect");
        if (error.message?.includes("invalid email")) {
          errorMessage = t("auth.emailFormatIncorrect");
        } else if (
          error.message?.toLowerCase().includes("invalid login credentials") ||
          error.message?.toLowerCase().includes("invalid email or password")
        ) {
          errorMessage = t("auth.emailOrPasswordIncorrect");
        } else if (error.message?.includes("User not confirmed")) {
          errorMessage = t("auth.pleaseVerifyEmail");
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (tenantSlug && data.user) {
        if (inviteToken) {
          await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
        } else {
          const hasAccess = await checkUserTenantAccess(data.user.id, tenantSlug);

          if (!hasAccess) {
            await supabase.auth.signOut();
            throw new Error(t("auth.noPermissionToEnterChurch"));
          }
        }
      }

      toast({
        title: t("auth.loginSuccess"),
        description: tenantName ? t("auth.welcomeBack", { tenantName }) : t("auth.welcomeToChabod"),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: t("auth.loginFailed"),
        description: error?.message || t("auth.emailOrPasswordIncorrect"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure email is trimmed before submitting
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({
        title: t("auth.resetPasswordFailed"),
        description: t("auth.emailEmpty"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin + "/auth",
      });

      if (error) {
        let errorMessage = t("auth.resetPasswordError");
        if (error.message?.includes("user not found")) {
          errorMessage = t("auth.userNotFound");
        } else if (error.message?.includes("invalid email")) {
          errorMessage = t("auth.emailFormatIncorrect");
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: t("auth.resetPasswordEmailSent"),
        description: t("auth.checkEmailForReset"),
      });

      setResetPasswordMode(false);
    } catch (error) {
      const errorMessage = error?.message || t("auth.unknownError");
      toast({
        title: t("auth.resetPasswordFailed"),
        description: errorMessage || t("auth.resetPasswordError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetPasswordMode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("auth.resetPassword")}</CardTitle>
          <CardDescription>{t("auth.resetPasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <AuthEmailInput id="reset-email" value={email} onChange={setEmail} disabled={loading} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.sending") : t("auth.sendResetPasswordLink")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => setResetPasswordMode(false)}>
            {t("auth.backToLogin")}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t("auth.signIn")}</CardTitle>
        <CardDescription>
          {tenantName ? t("auth.signInTo", { tenantName }) : t("auth.signInToChabod")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <AuthEmailInput value={email} onChange={setEmail} disabled={loading} />
          <AuthPasswordInput
            value={password}
            onChange={setPassword}
            disabled={loading}
            onForgotPassword={() => setResetPasswordMode(true)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.signIn")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSignUpClick}>
          {t("nav.signup")}
        </Button>
      </CardFooter>
    </Card>
  );
}
