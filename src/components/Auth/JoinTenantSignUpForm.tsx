import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { associateUserWithTenant } from "@/lib/membership-service";
import { TermsOfService } from "./TermsOfService";

interface JoinTenantSignUpFormProps {
  tenantName: string;
  tenantSlug: string;
  inviteToken?: string;
  onBack: () => void;
  onSuccess: () => void;
  prefilledEmail?: string;
  onSwitchToSignIn?: (email: string) => void;
}

export function JoinTenantSignUpForm({
  tenantName,
  tenantSlug,
  inviteToken,
  onBack,
  onSuccess,
  prefilledEmail,
  onSwitchToSignIn,
}: JoinTenantSignUpFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: prefilledEmail || "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSignInOption, setShowSignInOption] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError(t("auth:mustAcceptTerms"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSignInOption(false);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          },
          emailRedirectTo: `${window.location.origin}/tenant/${tenantSlug}`,
        },
      });

      if (signUpError) {
        // Check if it's a "user already registered" error
        if (
          signUpError.message.includes("User already registered") ||
          signUpError.message.includes("already been registered")
        ) {
          setError(t("auth:emailAlreadyRegistered"));
          setShowSignInOption(true);
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        try {
          await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
          onSuccess();
        } catch (associationError) {
          setError(
            associationError instanceof Error
              ? associationError.message
              : t("auth:cannotJoinChurch", { errorMessage: t("auth:unknownError") }),
          );
        }
      }
    } catch {
      setError(t("auth:unknownError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSignIn = () => {
    if (onSwitchToSignIn) {
      onSwitchToSignIn(formData.email);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">{t("auth:createYourAccount")}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("auth:joinChurchDesc", { tenantName })}
          {inviteToken && ` ${t("auth:invitedSpecialPermissions")}`}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("auth:firstName")}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("auth:lastName")}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth:email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              disabled={isLoading || !!prefilledEmail}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth:password")}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="space-y-2">
              <div className="text-sm text-destructive">{error}</div>
              {showSignInOption && onSwitchToSignIn && (
                <div className="text-sm text-muted-foreground">
                  {t("auth:alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    onClick={handleSwitchToSignIn}
                    className="text-primary hover:underline"
                  >
                    {t("auth:signInToJoin")}
                  </button>
                </div>
              )}
            </div>
          )}

          <TermsOfService accepted={termsAccepted} onChange={setTermsAccepted} />

          <Button type="submit" className="w-full" disabled={isLoading || !termsAccepted}>
            {isLoading ? t("auth:creatingAccount") : t("auth:joinChurch", { tenantName })}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
