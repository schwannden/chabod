import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Load translations first
const loadTranslations = async () => {
  try {
    const enTranslation = await fetch("/locales/en/translation.json").then((res) => res.json());
    const zhTWTranslation = await fetch("/locales/zh-TW/translation.json").then((res) =>
      res.json(),
    );

    return {
      en: { translation: enTranslation },
      "zh-TW": { translation: zhTWTranslation },
    };
  } catch (error) {
    console.error("Failed to load translations:", error);
    return {
      en: { translation: {} },
      "zh-TW": { translation: {} },
    };
  }
};

// Initialize i18n with loaded resources
const initializeI18n = async () => {
  const resources = await loadTranslations();

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: import.meta.env.MODE === "development",

      lng: "zh-TW", // Set default language to Traditional Chinese
      fallbackLng: "zh-TW",

      interpolation: {
        escapeValue: false, // React already does escaping
      },

      detection: {
        order: ["localStorage", "htmlTag", "navigator"],
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage"],
        checkWhitelist: true,
      },

      resources,

      // Whitelist supported languages
      supportedLngs: ["zh-TW", "en"],

      // Load namespaces
      ns: ["translation"],
      defaultNS: "translation",
    });

  // Force set to Traditional Chinese if no language preference found
  if (!localStorage.getItem("i18nextLng")) {
    i18n.changeLanguage("zh-TW");
  }
};

// Initialize and export a promise that resolves when i18n is ready
export const i18nPromise = initializeI18n();

export default i18n;
