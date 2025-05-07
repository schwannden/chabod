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
    <Card
      className={`border-0 ${highlighted ? "shadow-xl ring-2 ring-primary" : "shadow-md"} relative`}
    >
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
            {typeof price === "number" ? `NT$${price}` : price}
          </span>
          {typeof price === "number" && <span className="ml-1">/ 月</span>}
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

  if (isLoading) {
    return <div className="py-20 text-center">載入價格方案中...</div>;
  }

  // Helper function to get tier features
  const getTierFeatures = (tier: PriceTier) => {
    const features = [
      `會友人數上限: ${tier.user_limit} 人`,
      `小組數量上限: ${tier.group_limit} 個`,
      `活動數量上限: ${tier.event_limit} 個`,
    ];

    if (tier.name === "Free") {
      features.push("所有基本管理", "社群支援");
    } else if (tier.name === "Starter") {
      features.push("所有免費方案功能");
    } else if (tier.name === "Standard") {
      features.push("所有Starter功能", "優先支援");
    } else if (tier.name === "Advanced") {
      features.push("所有Standard功能", "優先支援");
    } else if (tier.name === "Pro") {
      features.push("所有Advanced功能", "專屬支援經理");
    }

    return features;
  };

  // Helper function to get tier button properties
  const getTierButtonProps = (tier: PriceTier) => {
    if (tier.name === "Free") {
      return {
        text: "立即開始",
        variant: "outline" as const,
        link: "/auth?tab=signup",
      };
    } else {
      return {
        text: "聯絡我們",
        variant: "default" as const,
        link: "mailto:support@fruitful-tools.com",
      };
    }
  };

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {priceTiers.map((tier, index) => {
            const buttonProps = getTierButtonProps(tier);
            const price = tier.name === "Free" ? "免費" : tier.price_monthly;
            const isHighlighted = tier.name === "Standard";

            return (
              <PricingCard
                key={tier.id || index}
                title={tier.name}
                price={price}
                description={tier.description}
                features={getTierFeatures(tier)}
                buttonText={buttonProps.text}
                buttonVariant={buttonProps.variant}
                buttonLink={buttonProps.link}
                highlighted={isHighlighted}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
