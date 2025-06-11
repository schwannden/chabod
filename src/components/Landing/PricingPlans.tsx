import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";
import { PriceTier } from "@/lib/types";
import { getPriceTiers } from "@/lib/tenant-service";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <Card
      className={`border-0 ${highlighted ? "shadow-xl ring-2 ring-primary" : "shadow-md"} relative`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-0 right-0 text-center">
          <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
            {t("landing:pricingPlans.recommended")}
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="mt-4">
          <span className="text-3xl font-bold">
            {typeof price === "number" ? `NT$${price}` : price}
          </span>
          {typeof price === "number" && (
            <span className="ml-1">{t("landing:pricingPlans.monthlyPrice")}</span>
          )}
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
  const { t } = useTranslation();

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
    return <div className="py-20 text-center">{t("landing:pricingPlans.loadingMessage")}</div>;
  }

  // Helper function to get tier features
  const getTierFeatures = (tier: PriceTier) => {
    const features = [
      t("landing:pricingPlans.userLimit", { count: tier.user_limit }),
      t("landing:pricingPlans.groupLimit", { count: tier.group_limit }),
      t("landing:pricingPlans.eventLimit", { count: tier.event_limit }),
    ];

    if (tier.name === "Free") {
      features.push(
        t("landing:pricingPlans.features.basicManagement"),
        t("landing:pricingPlans.features.communitySupport"),
      );
    } else if (tier.name === "Starter") {
      features.push(t("landing:pricingPlans.features.allFreeFeatures"));
    } else if (tier.name === "Standard") {
      features.push(
        t("landing:pricingPlans.features.allStarterFeatures"),
        t("landing:pricingPlans.features.prioritySupport"),
      );
    } else if (tier.name === "Advanced") {
      features.push(
        t("landing:pricingPlans.features.allStandardFeatures"),
        t("landing:pricingPlans.features.prioritySupport"),
      );
    } else if (tier.name === "Pro") {
      features.push(
        t("landing:pricingPlans.features.allAdvancedFeatures"),
        t("landing:pricingPlans.features.dedicatedSupport"),
      );
    }

    return features;
  };

  // Helper function to get tier button properties
  const getTierButtonProps = (tier: PriceTier) => {
    if (tier.name === "Free") {
      return {
        text: t("landing:pricingPlans.getStarted"),
        variant: "outline" as const,
        link: "/auth?tab=signup",
      };
    } else {
      return {
        text: t("landing:pricingPlans.contactUs"),
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
          <h2 className="text-3xl font-bold mb-4">{t("landing:pricingPlans.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing:pricingPlans.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {priceTiers.map((tier, index) => {
            const buttonProps = getTierButtonProps(tier);
            const price =
              tier.name === "Free" ? t("landing:pricingPlans.free") : tier.price_monthly;
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
