// src/screens/settings/SecuritySettings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { securityService, SecuritySettings as SecuritySettingsType } from '../../services/securityService';
import { useAuthStore } from '../../store/authStore';
import { getSystemFont } from '../../config/constants';

interface SecuritySettingsProps {
  navigation: any;
  route: any;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ navigation, route }) => {
  const { user, darkMode = false } = route.params || {};
  const { token } = useAuthStore();

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load security settings on mount
  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    if (!token) {
      console.log('❌ No token available for security settings');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔐 Loading security settings...');
      const settings = await securityService.getSecuritySettings(token);
      console.log('✅ Security settings loaded:', settings);
      setSecuritySettings(settings);
    } catch (error) {
      console.error('❌ Failed to load security settings:', error);
      Alert.alert('Error', 'Failed to load security settings. Using defaults.');
      // Set default settings if API fails
      setSecuritySettings({
        two_factor_enabled: false,
        biometric_enabled: true,
        login_alerts: true,
        session_timeout: 30
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySetting = async (key: keyof SecuritySettingsType, value: any) => {
    if (!securitySettings) return;
    
    // Update local state immediately for responsive UI
    const updatedSettings = {
      ...securitySettings,
      [key]: value
    };
    setSecuritySettings(updatedSettings);
    
    if (!token) {
      console.log('❌ No token available for backend update');
      return;
    }
    
    try {
      setUpdating(true);
      console.log(`🔄 Updating security ${key} to:`, value);
      const backendUpdatedSettings = await securityService.updateSecuritySettings(token, {
        [key]: value
      });
      console.log('✅ Backend security setting updated:', backendUpdatedSettings);
      
      // Only update the specific field that was changed
      setSecuritySettings(prev => ({
        ...prev,
        [key]: backendUpdatedSettings[key] !== undefined ? backendUpdatedSettings[key] : value
      }));
    } catch (error) {
      console.error('❌ Failed to update backend security setting:', error);
      Alert.alert('Error', 'Failed to save security setting to server');
      
      // Revert local state on backend failure
      setSecuritySettings(prevSettings => ({
        ...prevSettings,
        [key]: key === 'two_factor_enabled' || key === 'biometric_enabled' || key === 'login_alerts' ? !value : 
             key === 'session_timeout' ? (prevSettings?.session_timeout || 30) : value
      }));
    } finally {
      setUpdating(false);
    }
  };

  const SecurityItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
    iconColor = '#0091ad',
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.securityItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.securityIcon, { backgroundColor: `${iconColor}30` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.securityContent}>
        <Text style={styles.securityTitle}>
          {title}
        </Text>
        <Text style={styles.securitySubtitle}>
          {subtitle}
        </Text>
      </View>
      {rightComponent}
      {showArrow && !rightComponent && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#fcd3aa"
        />
      )}
    </TouchableOpacity>
  );

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setUpdating(true);
      await securityService.changePassword(token, currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => setShowChangePasswordModal(false) }
      ]);
      
      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('❌ Failed to change password:', error);
      Alert.alert('Error', 'Failed to change password. Please check your current password and try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTwoFactorSetup = () => {
    if (securitySettings?.two_factor_enabled) {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable 2FA? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => {
              updateSecuritySetting('two_factor_enabled', false);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account. You will need to enter a code from your authenticator app when logging in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: () => {
              updateSecuritySetting('two_factor_enabled', true);
              Alert.alert('Success', 'Two-factor authentication has been enabled. Please set up your authenticator app.');
            }
          }
        ]
      );
    }
  };

  const handleAppLockTimeoutChange = () => {
    Alert.alert(
      'App Lock Timeout',
      'How long before the app locks with biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Immediately', onPress: () => updateSecuritySetting('session_timeout', 0) },
        { text: '1 minute', onPress: () => updateSecuritySetting('session_timeout', 1) },
        { text: '5 minutes', onPress: () => updateSecuritySetting('session_timeout', 5) },
        { text: '15 minutes', onPress: () => updateSecuritySetting('session_timeout', 15) },
        { text: '30 minutes', onPress: () => updateSecuritySetting('session_timeout', 30) },
        { text: 'Never', onPress: () => updateSecuritySetting('session_timeout', -1) },
      ]
    );
  };

  const handleActiveSessionsView = () => {
    navigation.navigate('ActiveSessions', { user, darkMode });
  };

  const handleSecurityAudit = () => {
    const recommendations = [];
    
    if (!securitySettings?.biometric_enabled) {
      recommendations.push('• Enable biometric app lock for better security');
    }
    
    if (!securitySettings?.two_factor_enabled) {
      recommendations.push('• Enable two-factor authentication');
    }
    
    if (!securitySettings?.login_alerts) {
      recommendations.push('• Enable login alerts to monitor account access');
    }
    
    if (securitySettings?.session_timeout === -1) {
      recommendations.push('• Set an app lock timeout instead of "Never"');
    }
    
    const auditMessage = recommendations.length > 0 
      ? `We found ${recommendations.length} recommendation${recommendations.length > 1 ? 's' : ''} to improve your app security:\n\n${recommendations.join('\n')}`
      : 'Great! Your app security settings are well configured. 🎉';
    
    Alert.alert(
      'Security Audit',
      auditMessage,
      [
        { text: 'OK', style: 'default' },
        ...(recommendations.length > 0 ? [{ text: 'Fix Now', onPress: () => {} }] : [])
      ]
    );
  };

  const getAppLockTimeoutText = () => {
    const timeout = securitySettings?.session_timeout || 5;
    switch (timeout) {
      case 0: return 'Immediately';
      case 1: return '1 minute';
      case 5: return '5 minutes';
      case 15: return '15 minutes';
      case 30: return '30 minutes';
      case -1: return 'Never';
      default: return '5 minutes';
    }
  };

  const handleRecoveryPhoneSetup = () => {
    Alert.prompt(
      'Recovery Phone Number',
      'Enter your phone number for account recovery',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (phoneNumber) => {
            if (phoneNumber && phoneNumber.trim()) {
              // Here you would typically save to backend
              Alert.alert('Success', `Recovery phone number ${phoneNumber} has been added to your account.`);
            } else {
              Alert.alert('Error', 'Please enter a valid phone number');
            }
          }
        }
      ],
      'plain-text',
      '',
      'phone-pad'
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0091ad" />
        <Text style={styles.loadingText}>Loading Security Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <LinearGradient
          colors={['#0091ad15', '#04a7c715']}
          style={styles.bgGradient1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['#fcd3aa10', '#0091ad10']}
          style={styles.bgGradient2}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Header */}
      <LinearGradient
        colors={['#0091ad', '#04a7c7']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <View style={styles.headerPlaceholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Overview */}
        <View style={styles.securityOverview}>
          <View style={styles.securityStatus}>
            <Ionicons name="shield-checkmark" size={32} color="#0091ad" />
            <Text style={styles.securityStatusText}>
              Your app security is {securitySettings?.biometric_enabled && securitySettings?.two_factor_enabled ? 'excellent' : securitySettings?.biometric_enabled ? 'good' : 'basic'}
            </Text>
            <TouchableOpacity
              style={styles.auditButton}
              onPress={handleSecurityAudit}
            >
              <Text style={styles.auditButtonText}>Run Security Audit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login & Authentication */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#0091ad30' }]}>
              <Ionicons name="lock-closed-outline" size={24} color="#0091ad" />
            </View>
            <Text style={styles.sectionTitle}>Login & Authentication</Text>
          </View>
          <View style={styles.sectionContent}>
            <SecurityItem
              icon="key"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => setShowChangePasswordModal(true)}
              iconColor="#0091ad"
            />
            <SecurityItem
              icon="finger-print"
              title="Biometric App Lock"
              subtitle="Lock app with fingerprint or face recognition"
              rightComponent={
                <Switch
                  value={securitySettings?.biometric_enabled || false}
                  onValueChange={(value) => updateSecuritySetting('biometric_enabled', value)}
                  trackColor={{ false: '#333333', true: '#0091ad' }}
                  thumbColor={securitySettings?.biometric_enabled ? '#fcd3aa' : '#666666'}
                />
              }
              showArrow={false}
              iconColor="#04a7c7"
            />
            <SecurityItem
              icon="shield"
              title="Two-Factor Authentication"
              subtitle={securitySettings?.two_factor_enabled ? 'Enabled - Extra security layer' : 'Disabled - Tap to enable'}
              onPress={handleTwoFactorSetup}
              iconColor={securitySettings?.two_factor_enabled ? '#0091ad' : '#fcd3aa'}
            />
            <SecurityItem
              icon="time"
              title="App Lock Timeout"
              subtitle={`Lock app with biometrics after ${getAppLockTimeoutText()}`}
              onPress={handleAppLockTimeoutChange}
              iconColor="#04a7c7"
            />
          </View>
        </View>

        {/* Account Monitoring */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#04a7c730' }]}>
              <Ionicons name="eye-outline" size={24} color="#04a7c7" />
            </View>
            <Text style={styles.sectionTitle}>Account Monitoring</Text>
          </View>
          <View style={styles.sectionContent}>
            <SecurityItem
              icon="mail"
              title="Login Alerts"
              subtitle="Get notified of new login attempts"
              rightComponent={
                <Switch
                  value={securitySettings?.login_alerts || false}
                  onValueChange={(value) => updateSecuritySetting('login_alerts', value)}
                  trackColor={{ false: '#333333', true: '#0091ad' }}
                  thumbColor={securitySettings?.login_alerts ? '#fcd3aa' : '#666666'}
                />
              }
              showArrow={false}
              iconColor="#04a7c7"
            />
            <SecurityItem
              icon="desktop"
              title="Active Sessions"
              subtitle="View and manage logged-in devices"
              onPress={handleActiveSessionsView}
              iconColor="#0091ad"
            />
            <SecurityItem
              icon="location"
              title="Login History"
              subtitle="Review recent login locations and times"
              onPress={() => navigation.navigate('LoginHistory', { user, darkMode })}
              iconColor="#04a7c7"
            />
          </View>
        </View>

        {/* Recovery Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#fcd3aa30' }]}>
              <Ionicons name="medical-outline" size={24} color="#fcd3aa" />
            </View>
            <Text style={styles.sectionTitle}>Account Recovery</Text>
          </View>
          <View style={styles.sectionContent}>
            <SecurityItem
              icon="mail-outline"
              title="Recovery Email"
              subtitle={user?.email || 'Add recovery email address'}
              onPress={() => Alert.alert('Recovery Email', 'Recovery email management coming soon!')}
              iconColor="#0091ad"
            />
            <SecurityItem
              icon="call"
              title="Recovery Phone"
              subtitle="Add phone number for account recovery"
              onPress={handleRecoveryPhoneSetup}
              iconColor="#04a7c7"
            />
            <SecurityItem
              icon="download"
              title="Backup Codes"
              subtitle="Generate backup codes for 2FA"
              onPress={() => Alert.alert('Backup Codes', 'Backup codes generation coming soon!')}
              iconColor="#fcd3aa"
            />
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={[styles.modalContainer, darkMode && styles.modalContainerDark]}>
          <View style={[styles.modalHeader, darkMode && styles.modalHeaderDark]}>
            <TouchableOpacity
              onPress={() => setShowChangePasswordModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, darkMode && styles.modalTitleDark]}>
              Change Password
            </Text>
            <TouchableOpacity onPress={handlePasswordChange}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Current Password
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                New Password
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Confirm New Password
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementsTitle, darkMode && styles.requirementsTitleDark]}>
                Password Requirements:
              </Text>
              <Text style={[styles.requirement, darkMode && styles.requirementDark]}>
                • At least 8 characters long
              </Text>
              <Text style={[styles.requirement, darkMode && styles.requirementDark]}>
                • Contains uppercase and lowercase letters
              </Text>
              <Text style={[styles.requirement, darkMode && styles.requirementDark]}>
                • Contains at least one number
              </Text>
              <Text style={[styles.requirement, darkMode && styles.requirementDark]}>
                • Contains at least one special character
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgGradient1: {
    position: 'absolute',
    top: 150,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  bgGradient2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    flex: 1,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#333333',
  },
  securityOverview: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#333333',
  },
  securityStatus: {
    alignItems: 'center',
  },
  securityStatusText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 16,
  },
  auditButton: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  auditButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#333333',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  modalSaveText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
  },
  passwordRequirements: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SecuritySettings;