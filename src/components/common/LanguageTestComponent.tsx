import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../../i18n/simpleI18n';
import { useLanguage } from '../../hooks/useLanguage';

const LanguageTestComponent: React.FC = () => {
  const { t } = useTranslation();
  const { changeLanguage, currentLanguage } = useLanguage();

  const testLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>i18n Test Component</Text>
      <Text style={styles.currentLang}>Current: {currentLanguage}</Text>
      
      <Text style={styles.translatedText}>{t('auth.welcomeToYoFam')}</Text>
      <Text style={styles.translatedText}>{t('common.continue')}</Text>
      <Text style={styles.translatedText}>{t('navigation.dashboard')}</Text>
      
      <View style={styles.buttonContainer}>
        {testLanguages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.langButton,
              currentLanguage === lang.code && styles.activeButton
            ]}
            onPress={() => changeLanguage(lang.code)}
          >
            <Text style={styles.buttonText}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  currentLang: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  translatedText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  langButton: {
    backgroundColor: '#0091ad',
    padding: 8,
    margin: 4,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: '#04a7c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default LanguageTestComponent;