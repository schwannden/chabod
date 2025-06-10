import React from "react";
import { UserPlus, LogIn, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface TenantWelcomeScreenProps {
  tenantName: string;
  inviteToken?: string;
  onNewUser: () => void;
  onExistingUser: () => void;
  onMemberSignIn: () => void;
}

export function TenantWelcomeScreen({
  tenantName,
  inviteToken,
  onNewUser,
  onExistingUser,
  onMemberSignIn,
}: TenantWelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {inviteToken
            ? t("auth.invitedToJoin", { tenantName })
            : t("auth.welcomeToChurch", { tenantName })}
        </CardTitle>
        {inviteToken && <p className="text-sm text-muted-foreground">{t("auth.invitedDesc")}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onNewUser}
          className="w-full h-12 text-left justify-start"
          variant="outline"
        >
          <UserPlus className="h-5 w-5 mr-3" />
          <div>
            <div className="font-medium">{t("auth.newToChabod")}</div>
            <div className="text-sm text-muted-foreground">{t("auth.newToChabodDesc")}</div>
          </div>
        </Button>

        <Button
          onClick={onExistingUser}
          className="w-full h-12 text-left justify-start"
          variant="outline"
        >
          <LogIn className="h-5 w-5 mr-3" />
          <div>
            <div className="font-medium">{t("auth.haveAccount")}</div>
            <div className="text-sm text-muted-foreground">{t("auth.haveAccountDesc")}</div>
          </div>
        </Button>

        <Button
          onClick={onMemberSignIn}
          className="w-full h-12 text-left justify-start"
          variant="outline"
        >
          <Users className="h-5 w-5 mr-3" />
          <div>
            <div className="font-medium">{t("auth.alreadyMember")}</div>
            <div className="text-sm text-muted-foreground">{t("auth.alreadyMemberDesc")}</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
