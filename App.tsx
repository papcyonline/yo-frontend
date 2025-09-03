import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotificationService } from './src/services/NotificationService';
import { pushNotificationService } from './src/services/notifications/PushNotifications';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import logger from './src/services/LoggingService';
import ratingService from './src/services/RatingService';
import blockingService from './src/services/BlockingService';
import { CallManager } from './src/components/calls/CallManager';
import { NetworkStatus } from './src/components/common/NetworkStatus';

// Initialize simple i18n system
import './src/i18n/simpleI18n';

// App content component that has access to theme
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <ErrorBoundary>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.background} />
      <AppNavigator />
      <CallManager />
      <NetworkStatus />
    </ErrorBoundary>
  );
};

// Configure LogBox for development - only ignore specific known warnings
if (__DEV__) {
  LogBox.ignoreLogs([
    'Warning: AsyncStorage has been extracted from react-native',
    'Require cycle:', // Ignore require cycles for now
    'Non-serializable values were found in the navigation state', // Common RN navigation warning
  ]);
}

export default function App() {
  // Initialize notification services
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Initialize logging service first
        logger.info('App initialization started');
        
        // Initialize notification services
        await NotificationService.initialize();
        await pushNotificationService.initialize();
        
        // Initialize rating service
        await ratingService.initialize();
        
        // Initialize blocking service
        await blockingService.initialize();
        
        logger.info('All services initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize services', error);
      }
    };

    initializeNotifications();
    
    // Cleanup on app unmount
    return () => {
      pushNotificationService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}