
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}

export function Features() {
  const namingExplanation = "我們的事工名為「Chabod（כָּבוֹד）」，源自希伯來文，意指「榮耀」。這個名字回應了《撒母耳記》中的一段關鍵歷史——當神的約櫃被非利士人擄去時，以色列人驚呼「以迦博」（Ichabod），意思是「榮耀離開了以色列」。這是對神同在失落的極大哀嘆，但在耶穌基督裡，我們深信：神的榮耀從未止息，祂住在我們中間，正如昔日祂擊倒大袞一般，今天祂仍在這個數位化、AI快速擴張的世界中掌權。Chabod 是我們的宣告：無論世界如何改變，神的榮耀從未離席，依然運行、依然同在，並在每一個看似不可能的地方發出祂榮耀的光芒。";
  
  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-6 w-6 text-primary cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md text-sm p-4 text-left" side="bottom">
                  {namingExplanation}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h2 className="text-3xl font-bold mb-4">功能概覽</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Chabod 提供教會所需的全方位功能，讓管理更輕鬆
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard title="會友管理" description="管理教會成員資料，一切以人為本" />
          <FeatureCard title="分組管理" description="自訂管理教會組織，分類事工與教會活動" />
          <FeatureCard title="活動管理" description="對內活動安排不衝突，對外宣傳更輕鬆" />
          <FeatureCard title="資源管理" description="數位資產傳承，簡化行政工作" />
          <FeatureCard title="服事管理" description="安排服事人員，確保教會運作順暢" />
          <FeatureCard
            title="多語言支援(中文、英文)"
            description="支援中文介面，適合華人教會使用"
          />
        </div>
      </div>
    </section>
  );
}
