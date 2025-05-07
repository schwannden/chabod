
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";
import { PriceTier } from "@/lib/types";
import { getPriceTiers } from "@/lib/tenant-service";

interface PricingCardProps {
  title: string;
  price: string | number;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  highlighted?: boolean;
  buttonLink?: string;
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  buttonVariant,
  highlighted = false,
  buttonLink,
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
          <span className="text-3xl font-bold">
            {typeof price === 'number' ? `NT$${price}` : price}
          </span>
          {typeof price === 'number' && <span className="ml-1">/ 月</span>}
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
        {buttonLink ? (
          <Button asChild variant={buttonVariant} className="w-full">
            <Link to={buttonLink}>{buttonText}</Link>
          </Button>
        ) : (
          <Button variant={buttonVariant} className="w-full">
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PricingPlans() {
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPriceTiers = async () => {
      try {
        const tiers = await getPriceTiers();
        setPriceTiers(tiers);
      } catch (error) {
        console.error("Failed to load price tiers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPriceTiers();
  }, []);

  // Find specific tiers by name
  const freeTier = priceTiers.find(tier => tier.name === "Free") || null;
  const standardTier = priceTiers.find(tier => tier.name === "Standard") || null;
  const proTier = priceTiers.find(tier => tier.name === "Professional") || null;

  if (isLoading) {
    return <div className="py-20 text-center">載入價格方案中...</div>;
  }

  return (
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
            title={freeTier?.name || "基礎方案"} 
            price="免費" 
            description="適合小型團契或剛起步的教會"
            features={[
              `會友人數上限: ${freeTier?.user_limit || 50} 人`,
              `小組數量上限: ${freeTier?.group_limit || 10} 個`,
              `活動數量上限: ${freeTier?.event_limit || 20} 個`,
              "基本會友管理",
              "社群支援"
            ]}
            buttonText="立即開始"
            buttonVariant="outline"
            buttonLink="/auth?tab=signup"
          />
          
          <PricingCard 
            title={standardTier?.name || "標準方案"} 
            price={standardTier?.price_monthly || 1000} 
            description="適合中型教會的完整功能"
            features={[
              `會友人數上限: ${standardTier?.user_limit || 300} 人`,
              `小組數量上限: ${standardTier?.group_limit || 30} 個`,
              `活動數量上限: ${standardTier?.event_limit || 100} 個`,
              "所有基礎方案功能",
              "進階會友管理",
              "完整活動管理",
              "優先支援"
            ]}
            buttonText="聯絡我們"
            buttonVariant="default"
            highlighted={true}
          />
          
          <PricingCard 
            title={proTier?.name || "專業方案"} 
            price={proTier?.price_monthly || 2500} 
            description="適合大型教會的高級功能"
            features={[
              `會友人數上限: ${proTier?.user_limit || "無限"} 人`,
              `小組數量上限: ${proTier?.group_limit || "無限"} 個`,
              `活動數量上限: ${proTier?.event_limit || "無限"} 個`,
              "所有標準方案功能",
              "多教會管理",
              "自訂報表",
              "專屬支援經理"
            ]}
            buttonText="聯絡我們"
            buttonVariant="outline"
          />
        </div>
      </div>
    </section>
  );
}
