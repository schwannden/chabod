import React from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { PasswordSetupForm } from "./PasswordSetupForm";
import { AccountDeletionSection } from "./AccountDeletionSection";

export function SecuritySection() {
  const { t } = useTranslation("profile");
  const { user } = useSession();

  if (!user) {
    return null;
  }

  // Determine if user is Google OAuth user or email/password user
  const isGoogleUser = user?.identities?.some((identity) => identity.provider === "google");

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("security.title")}</CardTitle>
        <CardDescription>{t("security.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Management Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("security.password.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {isGoogleUser
              ? t("security.password.setupDescription")
              : t("security.password.changeDescription")}
          </p>
          {isGoogleUser ? <PasswordSetupForm /> : <PasswordChangeForm />}
        </div>

        <Separator />

        {/* Account Deletion Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("security.account.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("security.account.description")}</p>
          <AccountDeletionSection />
        </div>
      </CardContent>
    </Card>
  );
}
