import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
