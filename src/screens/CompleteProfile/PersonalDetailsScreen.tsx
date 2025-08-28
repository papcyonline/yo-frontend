//PersonalDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle as SvgCircle } from 'react-native-svg';

// Import components with default imports (fixed the import error)
import ModeSelectionView from './ModeSelectionView';
import VoiceAssistantView from './VoiceAssistantView';
import TypingFormView from './TypingFormView';

const API_BASE_URL = 'http://192.168.1.231:8081';

interface PersonalDetailsProps {
  navigation: any;
  route: any;
}

const PersonalDetailsScreen: React.FC<PersonalDetailsProps> = ({ navigation, route }) => {
  const params = route?.params || {};
  const { 
    userId = null, 
    email = '', 
    phone = '', 
    userToken = null,
    refreshToken = null,
    userData = null,
    fromCongrats = false, 
    fromDashboard = false 
  } = params;
  
  const [mode, setMode] = useState<'selection' | 'voice' | 'typing'>('selection');
  const [loading, setLoading] = useState(false);

  // Check if we have required params
  useEffect(() => {
    if (!userId && !fromDashboard && !userToken) {
      Alert.alert(
        'Error',
        'Missing user information. Please try logging in again.',
        [{
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }]
      );
    }
  }, [userId, fromDashboard, userToken]);

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup?',
      'You can complete your profile later, but some features may be limited.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        { 
          text: 'Skip for Now', 
          onPress: () => {
            navigation.replace('MainApp', {
              user: {
                id: userId || userData?.id || 'temp_user',
                email: email || userData?.email,
                phone: phone || userData?.phone,
                firstName: userData?.firstName || 'User',
                lastName: userData?.lastName || '',
                profileCompleted: false
              },
              profileIncomplete: true
            });
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Mark profile as completed
      const response = await fetch(`${API_BASE_URL}/api/users/profile/completion-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          profileCompleted: true,
          completedAt: new Date().toISOString()
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        Alert.alert(
          'Profile Complete!',
          'Your information has been saved successfully. AI can now provide better family matches!',
          [{
            text: 'Continue to Dashboard',
            onPress: () => {
              navigation.replace('MainApp', {
                user: {
                  id: userId || userData?.id || 'temp_user',
                  email: email || userData?.email,
                  phone: phone || userData?.phone,
                  firstName: userData?.firstName || 'User',
                  lastName: userData?.lastName || '',
                  profileCompleted: true
                },
                registrationComplete: true,
                profileIncomplete: false
              });
            }
          }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save profile completion status');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const commonProps = {
    handleSkip,
    handleSubmit,
    loading,
    navigation,
    userToken: userToken || '',
  };

  const renderCurrentView = () => {
    switch (mode) {
      case 'selection':
        return (
          <ModeSelectionView
            {...commonProps}
            onVoicePress={() => setMode('voice')}
            onTypePress={() => setMode('typing')}
          />
        );
      case 'voice':
        return (
          <VoiceAssistantView
            {...commonProps}
          />
        );
      case 'typing':
        return (
          <TypingFormView
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Black Background */}
      <View style={styles.blackBackground} />
      
      {/* Dotted Background Pattern - No Icons */}
      <View style={styles.dottedBackground}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern
              id="mainDots"
              patternUnits="userSpaceOnUse"
              width="20"
              height="20"
            >
              <SvgCircle
                cx="10"
                cy="10"
                r="1"
                fill="rgba(255, 255, 255, 0.08)"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#mainDots)" />
        </Svg>
      </View>
      
      {renderCurrentView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    position: 'relative',
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  dottedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.6,
  },
});

export default PersonalDetailsScreen;