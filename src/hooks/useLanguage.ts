import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import dictEn from '../content/en.json';
import dictRu from '../content/ru.json';

export type Language = 'en' | 'ru';
export type Content = typeof dictEn;

export interface LanguageContextState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Content;
}

const translations: Record<Language, Content> = {
  en: dictEn,
  ru: dictRu,
};

const LanguageContext = createContext<LanguageContextState | null>(null);

function detectLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const saved = window.localStorage.getItem('vrosk-lang');
  if (saved === 'en' || saved === 'ru') {
    return saved;
  }

  return window.navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  useEffect(() => {
    window.localStorage.setItem('vrosk-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
  };

  const toggleLang = () => {
    setLangState((current) => (current === 'en' ? 'ru' : 'en'));
  };

  return createElement(
    LanguageContext,
    { value: { lang, setLang, toggleLang, t: translations[lang] } },
    children,
  );
}

export function useLanguage(): LanguageContextState {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
