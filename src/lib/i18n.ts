import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Fallback translations to prevent crashes
const fallbackTranslations = {
  en: {
    translation: {
      common: {
        loading: "Loading...",
        error: "Error",
        save: "Save",
        cancel: "Cancel",
      },
    },
  },
  "zh-TW": {
    translation: {
      common: {
        loading: "載入中...",
        error: "錯誤",
        save: "儲存",
        cancel: "取消",
      },
    },
  },
};

// Load translations first
const loadTranslations = async () => {
  try {
    const [enResponse, zhTWResponse] = await Promise.allSettled([
      fetch("/locales/en/translation.json"),
      fetch("/locales/zh-TW/translation.json"),
    ]);

    const enTranslation =
      enResponse.status === "fulfilled"
        ? await enResponse.value.json()
        : fallbackTranslations.en.translation;

    const zhTWTranslation =
      zhTWResponse.status === "fulfilled"
        ? await zhTWResponse.value.json()
        : fallbackTranslations["zh-TW"].translation;

    return {
      en: { translation: enTranslation },
      "zh-TW": { translation: zhTWTranslation },
    };
  } catch (error) {
    console.error("Failed to load translations, using fallbacks:", error);
    return fallbackTranslations;
  }
};

// Normalize language codes to supported ones
const normalizeLanguageCode = (lang: string): string => {
  if (!lang) return "zh-TW";

  // Normalize common variations
  const lowerLang = lang.toLowerCase();

  // Chinese variants -> zh-TW
  if (lowerLang.startsWith("zh") || lowerLang.startsWith("cmn")) {
    return "zh-TW";
  }

  // English variants -> en
  if (lowerLang.startsWith("en")) {
    return "en";
  }

  // Default fallback
  return "zh-TW";
};

// Initialize i18n with loaded resources
const initializeI18n = async () => {
  try {
    const resources = await loadTranslations();

    // Check for existing language preference and normalize it
    const savedLanguage = localStorage.getItem("i18nextLng");
    const defaultLanguage = "zh-TW"; // Traditional Chinese as fallback

    // Normalize saved language if it exists
    if (savedLanguage) {
      const normalizedLang = normalizeLanguageCode(savedLanguage);
      if (normalizedLang !== savedLanguage) {
        localStorage.setItem("i18nextLng", normalizedLang);
      }
    }

    // Check if i18n is already initialized
    if (i18n.isInitialized) {
      console.log("i18n already initialized, skipping");
      return i18n;
    }

    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        // Disable debug to reduce console noise
        debug: false,

        // Set a default language initially
        lng: defaultLanguage,
        fallbackLng: defaultLanguage,

        interpolation: {
          escapeValue: false, // React already does escaping
        },

        detection: {
          order: ["localStorage", "htmlTag", "navigator"],
          lookupLocalStorage: "i18nextLng",
          caches: ["localStorage"],

          // Convert detected languages to supported ones
          convertDetectedLanguage: (lng: string) => {
            return normalizeLanguageCode(lng);
          },
        },

        resources,

        // Whitelist supported languages
        supportedLngs: ["zh-TW", "en"],

        // Clean supported languages when not found
        cleanCode: true,

        // Disable loading fallback messages
        saveMissing: false,

        // Disable pre-loading of resources
        preload: [],

        // Load namespaces
        ns: ["translation"],
        defaultNS: "translation",

        // Return key if translation is missing rather than error
        returnEmptyString: false,
        returnNull: false,

        // Silence warnings about missing keys
        missingKeyHandler: false,
      });

    // Handle language detection after initialization
    const detectedLanguage = normalizeLanguageCode(
      savedLanguage ||
        document.documentElement.lang ||
        navigator.language ||
        navigator.languages?.[0] ||
        defaultLanguage,
    );

    // Change to detected/normalized language if different from current
    if (i18n.language !== detectedLanguage) {
      await i18n.changeLanguage(detectedLanguage);
    }

    console.log("i18n initialized successfully with language:", i18n.language);
    return i18n;
  } catch (error) {
    console.error("Error during i18n initialization:", error);
    // Try to initialize with minimal config if everything fails
    if (!i18n.isInitialized) {
      await i18n.use(initReactI18next).init({
        lng: "zh-TW",
        fallbackLng: "zh-TW",
        resources: fallbackTranslations,
        interpolation: { escapeValue: false },
      });
    }
    return i18n;
  }
};

// Initialize and export a promise that resolves when i18n is ready
export const i18nPromise = initializeI18n().catch((error) => {
  console.error("Critical i18n initialization error:", error);
  // Return a basic configuration if everything fails
  return i18n;
});

export default i18n;
