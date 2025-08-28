// src/screens/auth/IntroScreen.tsx
import React from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';
import { useTranslation } from '../../i18n/simpleI18n';

// Components
import ImageSection from '../../components/auth/ImageSection';

const { height } = Dimensions.get('window');

const IntroScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });

  const handleNext = () => {
    navigation.navigate('TermsAndConditions');
  };


  return (
    <View style={dynamicStyles.container}>
      <ImageSection height={height - insets.bottom - 120} />
      
      {/* Simple Next Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#0091ad']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
          >
            <Text style={styles.buttonText}>{t('common.next')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.description}>
          {t('onboarding.discoverHeritage')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});


export default IntroScreen;