import { useEffect } from 'react';
import { getLocales } from 'expo-localization';
import { useAuthStore } from '../store/authStore';
import { i18n, LanguageCode } from '../i18n/simpleI18n';

export const useLanguage = () => {
  const { selectedLanguage, setLanguage } = useAuthStore();

  // Sync i18n language with auth store on app start
  useEffect(() => {
    const initializeLanguage = async () => {
      if (selectedLanguage && selectedLanguage !== i18n.getCurrentLanguage()) {
        // Use stored language preference
        i18n.setLanguage(selectedLanguage as LanguageCode);
        console.log('Using stored language:', selectedLanguage);
      } else if (!selectedLanguage) {
        // Detect device language using expo-localization
        try {
          const locales = getLocales();
          const deviceLanguage = locales[0]?.languageCode || 'en';
          const supportedLanguages = ['en', 'ar', 'fr', 'es', 'zh', 'de', 'it', 'pt', 'ru'];
          const supportedLanguage = supportedLanguages.includes(deviceLanguage) 
            ? deviceLanguage as LanguageCode 
            : 'en';
          
          console.log('Device language detected:', deviceLanguage, '-> Using:', supportedLanguage);
          setLanguage(supportedLanguage);
          i18n.setLanguage(supportedLanguage);
        } catch (error) {
          console.warn('Could not detect device language, using English:', error);
          setLanguage('en');
          i18n.setLanguage('en');
        }
      }
    };

    initializeLanguage();
  }, [selectedLanguage, setLanguage]);

  const changeLanguage = (languageCode: string) => {
    const langCode = languageCode as LanguageCode;
    i18n.setLanguage(langCode);
    setLanguage(languageCode);
  };

  return {
    currentLanguage: i18n.getCurrentLanguage(),
    changeLanguage,
    isReady: true, // Always ready since we don't need async initialization
  };
};