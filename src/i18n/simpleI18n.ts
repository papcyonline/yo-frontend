// Simple i18n implementation for React Native
// This avoids the complex dependency issues with react-i18next

import { useState, useEffect } from 'react';

// Import translation resources
import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';

const translations = {
  en,
  ar,
  fr,
  es,
  zh,
  de,
  it,
  pt,
  ru,
};

export type LanguageCode = keyof typeof translations;

type LanguageChangeListener = () => void;

class SimpleI18n {
  private currentLanguage: LanguageCode = 'en';
  private listeners: LanguageChangeListener[] = [];

  setLanguage(language: LanguageCode) {
    this.currentLanguage = language;
    this.notifyListeners();
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  addListener(listener: LanguageChangeListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: LanguageChangeListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return the key if not found in fallback
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  // Method to get available languages
  getAvailableLanguages(): { code: LanguageCode; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'ar', name: 'العربية' },
      { code: 'fr', name: 'Français' },
      { code: 'es', name: 'Español' },
      { code: 'zh', name: '中文' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
    ];
  }
}

export const i18n = new SimpleI18n();

// Export a hook for easy use in components that triggers re-renders
export const useTranslation = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    i18n.addListener(listener);
    return () => i18n.removeListener(listener);
  }, []);

  return {
    t: (key: string) => i18n.t(key),
    language: i18n.getCurrentLanguage(),
    changeLanguage: (lang: LanguageCode) => i18n.setLanguage(lang),
  };
};