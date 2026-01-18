'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, t as translate } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: keyof typeof translations, key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'zh') {
      setLanguage(saved);
    }
  }, []);

  // Save language preference to localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (section: keyof typeof translations, key: string): string => {
    return translate(section, key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language toggle component
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">{t('common', 'language')}:</span>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-sm rounded ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {t('common', 'english')}
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-2 py-1 text-sm rounded ${
          language === 'zh'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {t('common', 'chinese')}
      </button>
    </div>
  );
}
