import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

import { useNamingInfo } from "@/hooks/useNamingInfo";

export function ValueProposition() {
  const { isTooltipOpen, setIsTooltipOpen, namingExplanation } = useNamingInfo();
  return (
    <section className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-bold">我們的核心價值</h2>
            <TooltipProvider>
              <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                <TooltipTrigger asChild onClick={() => setIsTooltipOpen(!isTooltipOpen)}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Info className="h-6 w-6 text-primary" />
                    <span className="text-sm text-primary font-medium">點擊了解命名由來</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">{namingExplanation}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Chabod 團隊致力於開發真正滿足教會需求的數位工具
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>以人為本</CardTitle>
              <CardDescription>工具不會取代必要的人際互動</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>教會可以選擇需要的功能使用，不影響人的服事</li>
                <li>可以逐步導入，按照教會節奏調整</li>
                <li>減少行政負擔，釋放更多時間關懷人</li>
                <li>加強而非取代人與人之間的連結</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>信仰傳承</CardTitle>
              <CardDescription>
                教會已經存在兩千年，還會繼續存在，神會呼召年輕的世代來愛神，愛教會
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>新的世代面對忙碌與多元的資訊，需要系統化的數位資產</li>
                <li>簡化行政作業，讓年輕世代更容易參與服事</li>
                <li>單一入口，逐步累積教會需要的工具</li>
                <li>開源社群，讓教會可以共同參與</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
