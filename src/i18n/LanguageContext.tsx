// ============================================================
// src/i18n/LanguageContext.tsx
// ------------------------------------------------------------
// Language context, provider, and useTranslation hook for application-wide multi-language (ID/EN) support.
// ============================================================

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { id, type TranslationDictionary } from "./locales/id";

export type Language = "id" | "en";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  dictionary: TranslationDictionary;
}

const STORAGE_KEY = "app_language";

const LanguageContext = createContext<LanguageContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return "id"; // Default Bahasa Indonesia
  });
  const [englishDictionary, setEnglishDictionary] = useState<TranslationDictionary | null>(null);
  const englishPromiseRef = useRef<Promise<TranslationDictionary> | null>(null);

  const loadEnglishDictionary = useCallback(() => {
    if (!englishPromiseRef.current) {
      englishPromiseRef.current = import("./locales/en")
        .then(({ en }) => {
          setEnglishDictionary(en);
          return en;
        })
        .catch((error: unknown) => {
          englishPromiseRef.current = null;
          throw error;
        });
    }
    return englishPromiseRef.current;
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en") {
        void loadEnglishDictionary()
          .then(() => {
            if (active) setLanguageState("en");
          })
          .catch(() => undefined);
      }
    } catch {
      /* ignore */
    }
    return () => {
      active = false;
    };
  }, [loadEnglishDictionary]);

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    if (lang === "en") {
      void loadEnglishDictionary().then(() => setLanguageState("en")).catch(() => undefined);
      return;
    }
    setLanguageState("id");
  }, [loadEnglishDictionary]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "id" ? "en" : "id");
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dictionary = useMemo(
    () => (language === "en" ? englishDictionary ?? id : id),
    [language, englishDictionary],
  );

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const currentDict = (language === "en" ? englishDictionary ?? id : id) as unknown as Record<string, unknown>;
      let value = getNestedValue(currentDict, path);

      // Fallback to Indonesian if missing in English
      if (value === undefined) {
        const fallbackDict = id as unknown as Record<string, unknown>;
        value = getNestedValue(fallbackDict, path);
      }

      if (value === undefined) {
        return path;
      }

      return interpolate(value, params);
    },
    [language, englishDictionary]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      dictionary,
    }),
    [language, setLanguage, toggleLanguage, t, dictionary]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export const useLanguage = useTranslation;
