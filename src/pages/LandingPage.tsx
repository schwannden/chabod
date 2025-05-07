
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { NavBar } from "@/components/Layout/NavBar";
import { Info, Settings, DollarSign } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Chabod - 現代教會管理系統</h1>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
              專為現代教會設計的全方位管理平台，讓您專注於建立社群與服事
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

        {/* Features Section */}
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

        {/* Service Overview Section */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">服事管理</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                全方位的服事管理系統，協助您有效地安排和追蹤教會各項服事
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>服事團隊管理</CardTitle>
                  <CardDescription>有效地組織和管理不同服事團隊</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>創建和管理不同的服事團隊</li>
                    <li>追蹤服事人員的排班和出席情況</li>
                    <li>安排替補及調整服事時間表</li>
                    <li>自動發送提醒給即將服事的同工</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>服事排程</CardTitle>
                  <CardDescription>直覺式的服事排班與時間管理</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>直觀的月曆介面安排服事活動</li>
                    <li>基於角色和可用性智能推薦服事人選</li>
                    <li>衝突檢測，避免同一時間多重安排</li>
                    <li>追蹤服事時數和參與度</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">價格方案</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                彈性的價格方案，滿足不同規模教會的需求
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <PricingCard 
                title="基礎方案" 
                price="免費" 
                description="適合小型團契或剛起步的教會"
                features={[
                  "最多 50 位會友",
                  "基本會友管理",
                  "小組管理",
                  "活動管理（基本功能）",
                  "社群支援"
                ]}
                buttonText="立即開始"
                buttonVariant="outline"
              />
              
              <PricingCard 
                title="標準方案" 
                price="NT$1,000 / 月" 
                description="適合中型教會的完整功能"
                features={[
                  "最多 300 位會友",
                  "所有基礎方案功能",
                  "進階會友管理",
                  "完整活動管理",
                  "資源管理",
                  "服事管理",
                  "優先支援"
                ]}
                buttonText="聯絡我們"
                buttonVariant="default"
                highlighted={true}
              />
              
              <PricingCard 
                title="專業方案" 
                price="NT$2,500 / 月" 
                description="適合大型教會的高級功能"
                features={[
                  "無限會友數量",
                  "所有標準方案功能",
                  "多教會管理",
                  "自訂報表",
                  "API 整合",
                  "專屬支援經理",
                  "自訂網域"
                ]}
                buttonText="聯絡我們"
                buttonVariant="outline"
              />
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 px-4 bg-primary/10">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-6">開始使用 Chabod 進行教會管理</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              加入數百個教會的行列，體驗現代化的教會管理方式
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth">立即註冊</Link>
            </Button>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-background border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">Chabod</h3>
              <p className="text-muted-foreground">
                專為教會設計的全方位管理系統，讓您專注於建立社群與服事。
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">連結</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-muted-foreground hover:text-primary">功能</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-primary">價格</a></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary">登入</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">聯絡我們</h3>
              <p className="text-muted-foreground">
                有任何問題或建議？<br />
                請寄信至 <a href="mailto:info@chabod.app" className="text-primary hover:underline">info@chabod.app</a>
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Chabod. 保留所有權利。
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function FeatureCard({ title, description }: { title: string; description: string }) {
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

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  highlighted?: boolean;
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  buttonVariant,
  highlighted = false,
}: PricingCardProps) {
  return (
    <Card className={`border-0 ${highlighted ? 'shadow-xl ring-2 ring-primary' : 'shadow-md'} relative`}>
      {highlighted && (
        <div className="absolute -top-4 left-0 right-0 text-center">
          <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
            推薦方案
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="mt-4">
          <span className="text-3xl font-bold">{price}</span>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Button variant={buttonVariant} className="w-full">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
