import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useNamingInfo } from "@/hooks/useNamingInfo";

export function ValueProposition() {
  const { t } = useTranslation();
  const { isTooltipOpen, setIsTooltipOpen, namingExplanation } = useNamingInfo();

  return (
    <section className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-bold">{t("landing:values.title")}</h2>
            <TooltipProvider>
              <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                <TooltipTrigger asChild onClick={() => setIsTooltipOpen(!isTooltipOpen)}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Info className="h-6 w-6 text-primary" />
                    <span className="text-sm text-primary font-medium">
                      {t("landing:values.clickToLearnNaming")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">{namingExplanation}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing:values.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>{t("landing:values.peopleCentered")}</CardTitle>
              <CardDescription>{t("landing:values.peopleCenteredDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("landing:values.peopleCenteredList1")}</li>
                <li>{t("landing:values.peopleCenteredList2")}</li>
                <li>{t("landing:values.peopleCenteredList3")}</li>
                <li>{t("landing:values.peopleCenteredList4")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>{t("landing:values.faithInheritance")}</CardTitle>
              <CardDescription>{t("landing:values.faithInheritanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("landing:values.faithInheritanceList1")}</li>
                <li>{t("landing:values.faithInheritanceList2")}</li>
                <li>{t("landing:values.faithInheritanceList3")}</li>
                <li>{t("landing:values.faithInheritanceList4")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
