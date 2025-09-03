import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { getLocales } from 'expo-localization';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../i18n/simpleI18n';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../hooks/useLanguage';

const { height, width } = Dimensions.get('window');
const ITEM_HEIGHT = 70;
const VISIBLE_ITEMS = 7; // Show 7 items total (3 above, 1 center, 3 below)

const LANGUAGES = [
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
];

const LanguageSelectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { t, changeLanguage: changeTranslationLanguage } = useTranslation();
  const { changeLanguage, currentLanguage } = useLanguage();
  
  // Find the index of the currently selected language, default to device language or English
  const getInitialLanguageIndex = () => {
    // First check if there's a current language set
    if (currentLanguage) {
      const index = LANGUAGES.findIndex(lang => lang.code === currentLanguage);
      if (index >= 0) return index;
    }
    
    // Try to detect device language
    try {
      const locales = getLocales();
      const deviceLanguage = locales[0]?.languageCode || 'en';
      const index = LANGUAGES.findIndex(lang => lang.code === deviceLanguage);
      if (index >= 0) {
        // Set the device language immediately
        changeLanguage(deviceLanguage);
        changeTranslationLanguage(deviceLanguage as any);
        return index;
      }
    } catch (error) {
      console.warn('Could not detect device language:', error);
    }
    
    // Default to English if not found
    return 2; // English index
  };
  
  const [selectedIndex, setSelectedIndex] = useState(getInitialLanguageIndex());
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);

  // Create infinite scroll data by repeating the array multiple times
  const REPEAT_COUNT = 100; // Repeat languages 100 times for infinite scroll
  const infiniteLanguages = Array.from({ length: LANGUAGES.length * REPEAT_COUNT }, (_, index) => 
    LANGUAGES[index % LANGUAGES.length]
  );
  
  // Calculate initial position (middle of the infinite array)
  const initialPosition = Math.floor((infiniteLanguages.length / 2) / LANGUAGES.length) * LANGUAGES.length + selectedIndex;

  useEffect(() => {
    // Set initial scroll position after component mounts
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: initialPosition * ITEM_HEIGHT,
          animated: false
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (event: any) => {
    if (!isScrolling.current) return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const languageIndex = index % LANGUAGES.length;
    
    setSelectedIndex(languageIndex);
    // Update translation immediately for real-time button text change
    const selectedLanguage = LANGUAGES[languageIndex];
    changeTranslationLanguage(selectedLanguage.code as any);
  };

  const handleScrollBegin = () => {
    isScrolling.current = true;
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const languageIndex = index % LANGUAGES.length;
    
    setSelectedIndex(languageIndex);
    // Update translation immediately for real-time button text change
    const selectedLanguage = LANGUAGES[languageIndex];
    changeTranslationLanguage(selectedLanguage.code as any);
    
    // Reset scroll position if we're getting close to the edges for true infinite scroll
    scrollTimeout.current = setTimeout(() => {
      const totalItems = infiniteLanguages.length;
      const currentPosition = index;
      
      // If we're in the first or last 20% of items, reset to middle
      if (currentPosition < totalItems * 0.2 || currentPosition > totalItems * 0.8) {
        const newPosition = Math.floor(totalItems / 2) + (currentPosition % LANGUAGES.length);
        scrollViewRef.current?.scrollTo({
          y: newPosition * ITEM_HEIGHT,
          animated: false
        });
      }
      
      isScrolling.current = false;
    }, 100);
  };

  const handleContinue = async () => {
    const selectedLanguage = LANGUAGES[selectedIndex];
    console.log('Selected language:', selectedLanguage.name);
    
    // Update language using the hook
    await changeLanguage(selectedLanguage.code);
    
    navigation.navigate('Intro');
  };

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    text: {
      color: theme.text,
    },
    secondaryText: {
      color: theme.textSecondary,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      
      {/* Remove gradient overlay for cleaner light mode */}

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Logo at top */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/splash.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <Text style={[styles.subtitle, dynamicStyles.text]}>{t('language.choosePreferred')}</Text>
        </View>

        {/* Language Wheel Container */}
        <View style={styles.wheelContainer}>
          {/* Theme-based fade gradients */}
          <LinearGradient
            colors={isDark ? 
              ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent'] :
              ['rgba(245,245,245,0.95)', 'rgba(245,245,245,0.8)', 'rgba(245,245,245,0.4)', 'transparent']
            }
            style={styles.fadeTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={isDark ? 
              ['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)'] :
              ['transparent', 'rgba(245,245,245,0.4)', 'rgba(245,245,245,0.8)', 'rgba(245,245,245,0.95)']
            }
            style={styles.fadeBottom}
            pointerEvents="none"
          />
          
          {/* Smooth Scrollable Wheel with infinite scroll */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.wheel}
            contentContainerStyle={[
              styles.wheelContent,
              { 
                paddingTop: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                paddingBottom: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)
              }
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBegin}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
            bounces={false}
            overScrollMode="never"
            nestedScrollEnabled={false}
          >
            {infiniteLanguages.map((language, index) => {
              const scrollPosition = index;
              const centerPosition = Math.floor(infiniteLanguages.length / 2);
              const relativePosition = (scrollPosition - centerPosition) % LANGUAGES.length;
              const normalizedPosition = relativePosition < 0 ? relativePosition + LANGUAGES.length : relativePosition;
              
              const isSelected = normalizedPosition === selectedIndex;
              const distance = Math.min(
                Math.abs(normalizedPosition - selectedIndex),
                LANGUAGES.length - Math.abs(normalizedPosition - selectedIndex)
              );
              
              // Smooth opacity transition
              let opacity = 1;
              if (distance === 1) opacity = 0.6;
              else if (distance === 2) opacity = 0.4;
              else if (distance >= 3) opacity = 0.2;
              
              // Smooth scale transition
              let scale = 1;
              if (distance === 1) scale = 0.85;
              else if (distance === 2) scale = 0.7;
              else if (distance >= 3) scale = 0.6;
              
              return (
                <View
                  key={`${language.code}-${index}`}
                  style={[
                    styles.languageItem,
                    {
                      opacity,
                      transform: [{ scale }]
                    }
                  ]}
                >
                  <Text style={[
                    styles.languageText,
                    isSelected && styles.selectedText,
                    // Override with theme colors for better readability
                    { color: isSelected ? 
                        (isDark ? '#fcd3aa' : '#000000') : 
                        (isDark ? 'rgba(252, 211, 170, 0.6)' : 'rgba(0, 0, 0, 0.6)')
                    }
                  ]}>
                    {language.name}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Continue Button with new gradient */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7', '#0091ad']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.5, 1]}
            >
              <Text style={styles.buttonText}>{t('common.continue')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Selected language indicator */}
          <View style={styles.selectedLanguageContainer}>
            <Text style={[styles.selectedLanguageLabel, dynamicStyles.secondaryText]}>Selected:</Text>
            <Text style={[styles.selectedLanguageName, dynamicStyles.text]}>
              {LANGUAGES[selectedIndex].name}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Removed blackBackground - using theme-based container now
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  headerLogo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    // Color handled dynamically in component, removed shadow for clean text
  },
  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2.5,
    zIndex: 3,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2.5,
    zIndex: 3,
  },
  wheel: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '90%',
  },
  wheelContent: {
    alignItems: 'center',
  },
  languageItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  languageText: {
    fontSize: 22,
    fontWeight: '400',
    textAlign: 'center',
    // Remove text shadow for cleaner light mode text
  },
  selectedText: {
    fontSize: 28,
    fontWeight: '700',
    // Color handled dynamically in component
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    paddingTop: 30,
    alignItems: 'center',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 22,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedLanguageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectedLanguageLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.7)',
    marginBottom: 4,
  },
  selectedLanguageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fcd3aa',
    textShadowColor: 'rgba(0, 145, 173, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});

export default LanguageSelectionScreen;