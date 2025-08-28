// Two-Factor Authentication Setup Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

interface TwoFactorSetupScreenProps {
  navigation: any;
}

const TwoFactorSetupScreen: React.FC<TwoFactorSetupScreenProps> = ({ navigation }) => {
  const { token, user } = useAuthStore();
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'main' | 'setup' | 'verify' | 'backup'>('main');

  const toggleTwoFactor = async (enabled: boolean) => {
    if (enabled) {
      await setupTwoFactor();
    } else {
      await disableTwoFactor();
    }
  };

  const setupTwoFactor = async () => {
    try {
      setLoading(true);
      logger.debug('Setting up two-factor authentication');

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setQrCode(result.data.qrCode);
        setBackupCodes(result.data.backupCodes || []);
        setStep('setup');
        logger.info('Two-factor setup initiated');
      } else {
        throw new Error(result.message || 'Failed to setup 2FA');
      }
    } catch (error) {
      logger.error('Error setting up 2FA', error);
      Alert.alert('Error', 'Failed to setup two-factor authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    Alert.alert(
      'Disable Two-Factor Authentication',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_CONFIG.BASE_URL}/auth/2fa/disable`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                setIsTwoFactorEnabled(false);
                setStep('main');
                logger.info('Two-factor authentication disabled');
                Alert.alert('Success', 'Two-factor authentication has been disabled.');
              } else {
                throw new Error('Failed to disable 2FA');
              }
            } catch (error) {
              logger.error('Error disabling 2FA', error);
              Alert.alert('Error', 'Failed to disable two-factor authentication.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const verifyAndEnable = async () => {
    // This would normally require the user to enter a code from their authenticator app
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // In a real implementation, this would come from user input
          code: '123456'
        }),
      });

      if (response.ok) {
        setIsTwoFactorEnabled(true);
        setStep('backup');
        logger.info('Two-factor authentication enabled');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      logger.error('Error verifying 2FA', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMainScreen = () => (
    <ScrollView style={styles.content}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#0091ad', '#04a7c7']}
            style={styles.iconGradient}
          >
            <Ionicons name="shield-checkmark" size={32} color="#ffffff" />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.description}>
          Add an extra layer of security to your account by requiring a second form of authentication.
        </Text>
      </View>

      <View style={styles.toggleSection}>
        <View style={styles.toggleContainer}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Enable Two-Factor Authentication</Text>
            <Text style={styles.toggleDescription}>
              {isTwoFactorEnabled 
                ? 'Two-factor authentication is currently enabled'
                : 'Secure your account with 2FA'
              }
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#374151', true: '#0091ad' }}
            thumbColor={isTwoFactorEnabled ? '#ffffff' : '#9ca3af'}
            onValueChange={toggleTwoFactor}
            value={isTwoFactorEnabled}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Install an authenticator app like Google Authenticator</Text>
        </View>
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Scan the QR code with your authenticator app</Text>
        </View>
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Enter the 6-digit code to verify setup</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderSetupScreen = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.stepTitle}>Step 1: Scan QR Code</Text>
      <Text style={styles.stepDescription}>
        Use your authenticator app to scan this QR code:
      </Text>
      
      <View style={styles.qrContainer}>
        {qrCode ? (
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color="#0091ad" />
            <Text style={styles.qrText}>QR Code would appear here</Text>
            <Text style={styles.qrSubtext}>In production, use a QR code library</Text>
          </View>
        ) : (
          <ActivityIndicator size="large" color="#0091ad" />
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={verifyAndEnable} disabled={loading}>
        <Text style={styles.primaryButtonText}>
          {loading ? 'Verifying...' : 'I\'ve Scanned the Code'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('main')}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderBackupScreen = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.stepTitle}>Setup Complete!</Text>
      <Text style={styles.stepDescription}>
        Two-factor authentication is now enabled. Save these backup codes in a secure location:
      </Text>
      
      <View style={styles.backupCodesContainer}>
        {backupCodes.map((code, index) => (
          <View key={index} style={styles.backupCodeItem}>
            <Text style={styles.backupCodeText}>{code}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warningContainer}>
        <Ionicons name="warning" size={24} color="#f59e0b" />
        <Text style={styles.warningText}>
          Store these codes safely. You can use them to access your account if you lose your authenticator device.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('main')}>
        <Text style={styles.primaryButtonText}>I've Saved My Backup Codes</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Two-Factor Setup</Text>
        <View style={styles.headerSpacer} />
      </View>

      {step === 'main' && renderMainScreen()}
      {step === 'setup' && renderSetupScreen()}
      {step === 'backup' && renderBackupScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  toggleSection: {
    marginBottom: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.2)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    lineHeight: 22,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.2)',
  },
  qrText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginTop: 12,
  },
  qrSubtext: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  backupCodesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.2)',
  },
  backupCodeItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,145,173,0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  backupCodeText: {
    fontSize: 16,
    fontFamily: getSystemFont('mono'),
    color: '#ffffff',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#f59e0b',
    marginLeft: 12,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#0091ad',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.7)',
  },
});

export default TwoFactorSetupScreen;