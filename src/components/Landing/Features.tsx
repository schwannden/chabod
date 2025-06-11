import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 inline-flex items-center gap-2">
            {t("landing:features.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing:features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title={t("landing:features.memberManagement")}
            description={t("landing:features.memberManagementDesc")}
          />
          <FeatureCard
            title={t("landing:features.groupManagement")}
            description={t("landing:features.groupManagementDesc")}
          />
          <FeatureCard
            title={t("landing:features.eventManagement")}
            description={t("landing:features.eventManagementDesc")}
          />
          <FeatureCard
            title={t("landing:features.resourceManagement")}
            description={t("landing:features.resourceManagementDesc")}
          />
          <FeatureCard
            title={t("landing:features.serviceManagement")}
            description={t("landing:features.serviceManagementDesc")}
          />
          <FeatureCard
            title={t("landing:features.multiLanguage")}
            description={t("landing:features.multiLanguageDesc")}
          />
        </div>
      </div>
    </section>
  );
}
