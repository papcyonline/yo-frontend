// src/screens/auth/components/ImageSection.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';

interface ImageSectionProps {
  height: number;
}

const ImageSection: React.FC<ImageSectionProps> = ({ height }) => {
  const { theme, isDark } = useTheme();
  
  // Debug logging
  console.log('🖼️ ImageSection - isDark:', isDark, 'theme.background:', theme.background);
  
  // Dynamic overlay based on theme
  const overlayStyle = {
    ...styles.overlay,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)', // White overlay for light mode
  };
  
  return (
    <View style={[styles.imageSection, { height }]}>
      <ImageBackground 
        source={require('../../../assets/intro.gif')} 
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Theme-based Overlay */}
        <View style={overlayStyle} />
        
        {/* Content on Image */}
        <View style={[styles.imageContent, { height }]}>
          {/* Logo and Title */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/splash.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={[styles.title, { color: isDark ? '#fcd3aa' : '#000000' }]}>fam</Text>
            <Text style={[styles.subtitle, { color: isDark ? 'rgba(252, 211, 170, 0.9)' : '#333333' }]}>
              Connect with your family heritage and build meaningful relationships
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="people-outline" size={28} color="#0091ad" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: isDark ? '#fcd3aa' : '#000000' }]}>Find & Connect</Text>
                <Text style={[styles.featureDescription, { color: isDark ? 'rgba(252, 211, 170, 0.8)' : '#333333' }]}>Discover relatives around the world</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="globe-outline" size={28} color="#04a7c7" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: isDark ? '#fcd3aa' : '#000000' }]}>Heritage Discovery</Text>
                <Text style={[styles.featureDescription, { color: isDark ? 'rgba(252, 211, 170, 0.8)' : '#333333' }]}>Explore your family's origins</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="heart-outline" size={28} color="#0091ad" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: isDark ? '#fcd3aa' : '#000000' }]}>Share Stories</Text>
                <Text style={[styles.featureDescription, { color: isDark ? 'rgba(252, 211, 170, 0.8)' : '#333333' }]}>Preserve family memories forever</Text>
              </View>
            </View>
          </View>

          {/* Empty space for visual balance */}
          <View style={styles.spacer} />
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  backgroundImageStyle: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imageContent: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Removed the blurred green background
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 36,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa', // Updated to new color scheme
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(252, 211, 170, 0.9)', // Updated to new color scheme
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresSection: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 145, 173, 0.2)', // Updated to new color scheme
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa', // Updated to new color scheme
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(252, 211, 170, 0.8)', // Updated to new color scheme
    lineHeight: 18,
  },
  spacer: {
    height: 20,
  },
});

export default ImageSection;