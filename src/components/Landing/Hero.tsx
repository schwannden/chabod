import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNamingInfo } from "@/hooks/useNamingInfo";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { isTooltipOpen, setIsTooltipOpen, namingExplanation } = useNamingInfo();
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 inline-flex items-center justify-center gap-2">
          {t("landing:hero.title")}
          <TooltipProvider>
            <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
              <TooltipTrigger asChild onClick={() => setIsTooltipOpen(!isTooltipOpen)}>
                <Info className="h-5 w-5 text-primary cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm" side="bottom" sideOffset={5}>
                {namingExplanation}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
          {t("landing:hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base">
            <Link to="/auth">{t("landing:hero.getStarted")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <a href="#features">{t("landing:hero.learnMore")}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
