import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNamingInfo } from "@/hooks/useNamingInfo";

export function Hero() {
  const { isTooltipOpen, setIsTooltipOpen, namingExplanation } = useNamingInfo();

  return (
    <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 inline-flex items-center justify-center gap-2">
          Chabod
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
          專為現代教會設計的全方位管理平台，傳承數位資產，簡化行政工作。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base">
            <Link to="/auth">立即開始</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <a href="#features">了解更多</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
