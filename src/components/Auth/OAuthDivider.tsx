import React from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";

export function OAuthDivider() {
  const { t } = useTranslation("auth");

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{t("orContinueWith")}</span>
      </div>
    </div>
  );
}
