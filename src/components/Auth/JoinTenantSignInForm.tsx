import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { associateUserWithTenant } from "@/lib/membership-service";

interface JoinTenantSignInFormProps {
  tenantName: string;
  tenantSlug: string;
  inviteToken?: string;
  onBack: () => void;
  onSuccess: () => void;
  prefilledEmail?: string;
}

export function JoinTenantSignInForm({
  tenantName,
  tenantSlug,
  inviteToken,
  onBack,
  onSuccess,
  prefilledEmail,
}: JoinTenantSignInFormProps) {
  const [formData, setFormData] = useState({
    email: prefilledEmail || "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
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
              : t("auth.cannotJoinChurch", { errorMessage: "Unknown error" }),
          );
        }
      }
    } catch {
      setError(t("auth.unknownError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">{t("auth.signInToJoin")}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("auth.signInExistingDesc", { tenantName })}
          {inviteToken && ` ${t("auth.invitedSpecialPermissions")}`}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
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
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("auth.signingIn") : t("auth.joinChurch", { tenantName })}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
