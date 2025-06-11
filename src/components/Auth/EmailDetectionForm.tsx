import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmailDetectionFormProps {
  tenantName: string;
  onBack: () => void;
  onEmailChecked: (email: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function EmailDetectionForm({
  tenantName,
  onBack,
  onEmailChecked,
  isLoading,
  error,
}: EmailDetectionFormProps) {
  const [email, setEmail] = useState("");
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    onEmailChecked(email);
  };

  // Translate error messages
  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return null;

    switch (errorCode) {
      case "EMAIL_CHECK_FAILED":
        return t("auth.emailCheckFailed");
      default:
        return errorCode; // Return original error if not recognized
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">{t("auth.whatsYourEmail")}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{t("auth.emailCheckDesc", { tenantName })}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.enterEmailAddress")}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-sm text-destructive">{getErrorMessage(error)}</div>}

          <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
            {isLoading ? t("auth.checking") : t("auth.continue")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
