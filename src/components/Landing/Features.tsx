
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">功能概覽</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Chabod 提供教會所需的全方位功能，讓管理更輕鬆
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            title="會友管理" 
            description="輕鬆管理教會成員資料，追蹤參與度及聯絡資訊" 
          />
          <FeatureCard 
            title="小組管理" 
            description="組織和管理教會小組，掌握小組動態" 
          />
          <FeatureCard 
            title="活動管理" 
            description="規劃及組織教會活動，管理報名與出席" 
          />
          <FeatureCard 
            title="資源管理" 
            description="有效管理教會資源，包括場地、設備等" 
          />
          <FeatureCard 
            title="服事管理" 
            description="安排志工與服事人員，確保教會運作順暢" 
          />
          <FeatureCard 
            title="多語言支援" 
            description="支援中文介面，適合台灣及華人教會使用" 
          />
        </div>
      </div>
    </section>
  );
}
