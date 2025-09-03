// Profile Setup Get Started Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ProfileSetupProps {
  navigation: any;
  route: any;
}

const ProfileSetupScreen: React.FC<ProfileSetupProps> = ({ navigation, route }) => {
  const { user } = route.params || {};

  const handleStartProfile = () => {
    navigation.navigate('ProgressiveProfile', { user, mode: 'form' });
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#000000', '#0a1a2a', '#1a0a2a', '#000000']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fcd3aa" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Help us find your perfect matches with a few quick questions</Text>
          </View>

          {/* Center Design */}
          <View style={styles.centerDesign}>
            <LinearGradient
              colors={['rgba(0,145,173,0.3)', 'rgba(4,167,199,0.2)', 'rgba(252,211,170,0.1)']}
              style={styles.centerCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.innerCircle}>
                <Ionicons name="person-add" size={48} color="#fcd3aa" />
              </View>
            </LinearGradient>
            
            <View style={styles.orbitsContainer}>
              <View style={[styles.orbit, styles.orbit1]} />
              <View style={[styles.orbit, styles.orbit2]} />
              <View style={[styles.orbit, styles.orbit3]} />
            </View>
          </View>
          
          {/* Benefits Preview */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={16} color="#0091ad" />
              <Text style={styles.benefitText}>Find family connections</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="heart" size={16} color="#0091ad" />
              <Text style={styles.benefitText}>Discover friendship matches</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="globe" size={16} color="#0091ad" />
              <Text style={styles.benefitText}>Join heritage communities</Text>
            </View>
          </View>

          {/* Skip */}
          <TouchableOpacity style={styles.skipContainer} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Get Started Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.getStartedButton} 
            onPress={handleStartProfile}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.getStartedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.timeEstimate}>Takes about 5-10 minutes</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252,211,170,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: 40, 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#ffffff', 
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: { 
    fontSize: 16, 
    fontWeight: '400', 
    color: 'rgba(252, 211, 170, 0.8)', 
    textAlign: 'center',
  },
  centerDesign: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(252,211,170,0.3)',
  },
  orbitsContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
    borderRadius: 1000,
  },
  orbit1: {
    width: 220,
    height: 220,
  },
  orbit2: {
    width: 260,
    height: 260,
    borderColor: 'rgba(0,145,173,0.15)',
  },
  orbit3: {
    width: 300,
    height: 300,
    borderColor: 'rgba(4,167,199,0.1)',
  },
  skipContainer: { 
    alignItems: 'center',
    paddingVertical: 20,
  },
  skipText: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: 'rgba(252, 211, 170, 0.7)',
  },
  benefitsContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,145,173,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.2)',
    minWidth: 200,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  getStartedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '100%',
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 12,
  },
  timeEstimate: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(252,211,170,0.7)',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ProfileSetupScreen;