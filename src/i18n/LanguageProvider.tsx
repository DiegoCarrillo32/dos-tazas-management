'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Language, DictionaryKey } from './dictionaries';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: DictionaryKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const storedLang = localStorage.getItem('app-language') as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'es')) {
      setLanguageState(storedLang);
    } else {
      // Auto-detect browser language if no preference
      const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
      setLanguageState(browserLang);
    }
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: DictionaryKey): string => {
    // Fallback to English if translation is missing (or if unmounted to prevent hydration mismatches, though it's better to just return the string)
    // To completely prevent hydration mismatch, we could render nothing until mounted, but that causes a flash.
    // Usually it's better to render default language and swap.
    return dictionaries[language][key] || dictionaries['en'][key] || key;
  };

  // To prevent hydration mismatch, we might render a loader or just English initially.
  // We'll just render with the state, which might cause a mismatch warning if the server 
  // rendered in English but the client is Spanish. Since Next.js App router is heavily server-side, 
  // typical pattern for pure localStorage is to ignore hydration mismatch or suppress it.
  // We can wrap the inner content in a div with suppressHydrationWarning.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div suppressHydrationWarning style={{ display: 'contents' }}>
        {mounted ? children : children} 
      </div>
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
