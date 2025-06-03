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

  // Check for existing language preference
  const savedLanguage = localStorage.getItem("i18nextLng");
  const defaultLanguage = "zh-TW"; // Traditional Chinese as fallback

  // Clean up any inconsistent language codes (en-US -> en)
  if (savedLanguage === "en-US") {
    localStorage.setItem("i18nextLng", "en");
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: import.meta.env.MODE === "development",

      // Don't force a language - let detection work
      lng: undefined, // Let LanguageDetector handle this
      fallbackLng: defaultLanguage,

      interpolation: {
        escapeValue: false, // React already does escaping
      },

      detection: {
        order: ["localStorage", "htmlTag", "navigator"],
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage"],
      },

      resources,

      // Whitelist supported languages
      supportedLngs: ["zh-TW", "en"],

      // Load namespaces
      ns: ["translation"],
      defaultNS: "translation",
    });

  // Only set default if no language preference exists at all
  const finalSavedLanguage = localStorage.getItem("i18nextLng");
  if (!finalSavedLanguage) {
    console.log("No language preference found, setting default to:", defaultLanguage);
    await i18n.changeLanguage(defaultLanguage);
  } else {
    console.log("Using saved language preference:", finalSavedLanguage);
  }
};

// Initialize and export a promise that resolves when i18n is ready
export const i18nPromise = initializeI18n();

export default i18n;
