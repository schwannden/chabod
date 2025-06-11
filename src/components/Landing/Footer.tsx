import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Chabod</h3>
            <p className="text-muted-foreground">{t("landing:footer.description")}</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">{t("landing:footer.links")}</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-1">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary">
                  {t("landing:footer.features")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-primary">
                  {t("landing:footer.pricing")}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/schwannden/chabod"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {t("landing:footer.contribute")}
                </a>
              </li>
              <li>
                <a
                  href="/legal/terms-of-service.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  {t("landing:footer.terms")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">{t("landing:footer.contact")}</h3>
            <p className="text-muted-foreground">
              {t("landing:footer.contactDescription")}
              <br />
              {t("landing:footer.contactEmail")}{" "}
              <a href="mailto:support@fruitful-tools.com" className="text-primary hover:underline">
                support@fruitful-tools.com
              </a>
            </p>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          {t("landing:footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
