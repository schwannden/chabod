import { useState } from "react";
import { useTranslation } from "react-i18next";

export function useNamingInfo() {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const { t } = useTranslation();

  const namingExplanation = t("landing:namingExplanation");

  return {
    isTooltipOpen,
    setIsTooltipOpen,
    namingExplanation,
  };
}
