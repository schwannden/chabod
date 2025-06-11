import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Define all namespaces
const namespaces = [
  "common",
  "announcements",
  "shared",
  "nav",
  "landing",
  "auth",
  "tenant",
  "profile",
  "members",
  "groups",
  "resources",
  "services",
  "serviceEvents",
  "events",
  "dashboard",
];

// Fallback translations to prevent crashes
const fallbackTranslations = {
  en: namespaces.reduce(
    (acc, ns) => {
      acc[ns] = {
        loading: "Loading...",
        error: "Error",
        save: "Save",
        cancel: "Cancel",
      };
      return acc;
    },
    {} as Record<string, Record<string, string>>,
  ),
  "zh-TW": namespaces.reduce(
    (acc, ns) => {
      acc[ns] = {
        loading: "載入中...",
        error: "錯誤",
        save: "儲存",
        cancel: "取消",
      };
      return acc;
    },
    {} as Record<string, Record<string, string>>,
  ),
};

// Load translations from multiple files
const loadTranslations = async () => {
  try {
    const resources: Record<string, Record<string, Record<string, string>>> = {
      en: {},
      "zh-TW": {},
    };

    // Load all namespace files for both languages
    const loadPromises = [];

    for (const ns of namespaces) {
      loadPromises.push(
        fetch(`/locales/en/${ns}.json`)
          .then((res) => res.json())
          .then((data) => {
            resources.en[ns] = data;
          })
          .catch((error) => {
            console.warn(`Failed to load English ${ns} translations:`, error);
            resources.en[ns] = fallbackTranslations.en[ns];
          }),
      );

      loadPromises.push(
        fetch(`/locales/zh-TW/${ns}.json`)
          .then((res) => res.json())
          .then((data) => {
            resources["zh-TW"][ns] = data;
          })
          .catch((error) => {
            console.warn(`Failed to load Chinese ${ns} translations:`, error);
            resources["zh-TW"][ns] = fallbackTranslations["zh-TW"][ns];
          }),
      );
    }

    await Promise.allSettled(loadPromises);

    return resources;
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

    // Determine the initial language
    let initialLanguage = defaultLanguage;

    if (savedLanguage) {
      // If there's a saved language, normalize it
      initialLanguage = normalizeLanguageCode(savedLanguage);
      if (initialLanguage !== savedLanguage) {
        localStorage.setItem("i18nextLng", initialLanguage);
      }
    }
    // If no saved language, keep defaultLanguage (zh-TW) - don't detect from browser

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

        // Set the determined initial language
        lng: initialLanguage,
        fallbackLng: defaultLanguage,

        interpolation: {
          escapeValue: false, // React already does escaping
        },

        detection: {
          // Only use localStorage, don't detect from browser/html if no saved preference
          order: ["localStorage"],
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

        // Load all namespaces
        ns: namespaces,
        defaultNS: "common",

        // Return key if translation is missing rather than error
        returnEmptyString: false,
        returnNull: false,

        // Silence warnings about missing keys
        missingKeyHandler: false,
      });

    // Ensure the correct language is set and saved
    if (i18n.language !== initialLanguage) {
      await i18n.changeLanguage(initialLanguage);
    }

    // Save to localStorage if it wasn't there before
    if (!savedLanguage) {
      localStorage.setItem("i18nextLng", initialLanguage);
      console.log("Set default language to localStorage:", initialLanguage);
    }

    console.log("i18n initialized successfully with language:", i18n.language);
    console.log("Loaded namespaces:", namespaces);
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
        ns: ["common"],
        defaultNS: "common",
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
