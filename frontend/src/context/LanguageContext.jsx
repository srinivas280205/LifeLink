import { createContext, useContext, useState, useCallback } from 'react';
import en from '../i18n/en';
import ta from '../i18n/ta';

const TRANSLATIONS = { en, ta };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('ll-lang') || 'en'
  );

  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'ta' : 'en';
      localStorage.setItem('ll-lang', next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((code) => {
    localStorage.setItem('ll-lang', code);
    setLang(code);
  }, []);

  /**
   * t('key') → translated string
   * Falls back to English if Tamil key missing.
   */
  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggle, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
