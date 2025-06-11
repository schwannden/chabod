import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function CallToAction() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 bg-primary/10">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold mb-6">{t("landing:cta.title")}</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("landing:cta.subtitle")}
        </p>
        <Button asChild size="lg" className="text-lg px-8">
          <Link to="/auth?tab=signup">{t("landing:cta.signUp")}</Link>
        </Button>
      </div>
    </section>
  );
}
