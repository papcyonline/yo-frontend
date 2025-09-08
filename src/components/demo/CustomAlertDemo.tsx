import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../context/AlertContext';

export const CustomAlertDemo: React.FC = () => {
  const { 
    showAlert, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    showNetworkError,
    success,
    error,
    warning,
    info 
  } = useAlert();

  const demoButtons = [
    {
      title: 'Login Failed',
      subtitle: 'Common login error',
      icon: 'lock-closed',
      gradient: ['#ef4444', '#dc2626'],
      onPress: () => showError(
        'Login Failed',
        'Invalid email or password. Please check your credentials and try again.',
        [
          { text: 'Forgot Password', onPress: () => console.log('Navigate to forgot password') },
          { text: 'Try Again', style: 'default' }
        ]
      ),
    },
    {
      title: 'Network Error',
      subtitle: 'Connection issue',
      icon: 'wifi-outline',
      gradient: ['#ef4444', '#dc2626'],
      onPress: () => showNetworkError('Unable to connect to server. Please check your internet connection.'),
    },
    {
      title: 'Success Message',
      subtitle: 'Profile updated',
      icon: 'checkmark-circle',
      gradient: ['#10b981', '#059669'],
      onPress: () => showSuccess(
        'Profile Updated!',
        'Your profile information has been successfully updated.',
        [{ text: 'Great!', style: 'default' }]
      ),
    },
    {
      title: 'Warning Alert',
      subtitle: 'Unsaved changes',
      icon: 'warning',
      gradient: ['#f59e0b', '#d97706'],
      onPress: () => showWarning(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave this page?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => console.log('Navigate away') }
        ]
      ),
    },
    {
      title: 'Information',
      subtitle: 'App update available',
      icon: 'information-circle',
      gradient: ['#3b82f6', '#2563eb'],
      onPress: () => showInfo(
        'Update Available',
        'A new version of the app is available. Would you like to update now?',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update Now', style: 'default', onPress: () => console.log('Start update') }
        ]
      ),
    },
    {
      title: 'Toast Success',
      subtitle: 'Quick notification',
      icon: 'thumbs-up',
      gradient: ['#10b981', '#059669'],
      onPress: () => success('Settings saved successfully!'),
    },
    {
      title: 'Toast Error',
      subtitle: 'Quick error message',
      icon: 'close-circle',
      gradient: ['#ef4444', '#dc2626'],
      onPress: () => error('Failed to sync data'),
    },
    {
      title: 'Custom Alert',
      subtitle: 'Advanced options',
      icon: 'settings',
      gradient: ['#8b5cf6', '#7c3aed'],
      onPress: () => showAlert({
        type: 'warning',
        title: 'Clear All Data?',
        message: 'This action cannot be undone. All your app data will be permanently deleted.',
        showIcon: true,
        autoHide: false,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Data', style: 'destructive', onPress: () => console.log('Data cleared') }
        ]
      }),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Alert System</Text>
        <Text style={styles.subtitle}>Beautiful, customizable alerts for your app</Text>
      </View>

      <View style={styles.grid}>
        {demoButtons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={styles.demoButton}
            onPress={button.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={button.gradient as any}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.buttonContent}>
                <Ionicons 
                  name={button.icon as any} 
                  size={24} 
                  color="#ffffff" 
                  style={styles.buttonIcon}
                />
                <View style={styles.buttonText}>
                  <Text style={styles.buttonTitle}>{button.title}</Text>
                  <Text style={styles.buttonSubtitle}>{button.subtitle}</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color="rgba(255,255,255,0.7)" 
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  demoButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    padding: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default CustomAlertDemo;