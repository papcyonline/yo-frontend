import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { AuthStorage } from '../utils/AuthStorage';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
 

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LanguageSelectionScreen from '../screens/auth/LanguageSelectionScreen';
import IntroScreen from '../screens/auth/IntroScreen';
import TermsAndConditionsScreen from '../screens/auth/TermsAndConditionsScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Onboarding Screens
import UserInfoScreen from '../screens/auth/UserInfoScreen';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import PhoneVerificationScreen from '../screens/onboarding/PhoneVerificationScreen';
import EmailPasswordScreen from '../screens/onboarding/EmailPasswordScreen';
import EmailVerificationScreen from '../screens/onboarding/EmailVerificationScreen';
import CongratulationsScreen from '../screens/onboarding/CongratulationsScreen';
import PersonalDetailsScreen from '../screens/CompleteProfile/PersonalDetailsScreen';
import ProfileSetupScreen from '../screens/CompleteProfile/ModeSelectionView';
import ProgressiveProfileScreen from '../screens/CompleteProfile/ProgressiveProfileScreen';
import UnifiedOnboardingScreen from '../screens/onboarding/UnifiedOnboardingScreen';
import OnboardingCompletionScreen from '../screens/onboarding/OnboardingCompletionScreen';
import SetupChoiceScreen from '../screens/onboarding/SetupChoiceScreen';
import VoiceSetupScreen from '../screens/onboarding/VoiceSetupScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import EnhancedWelcomeScreen from '../screens/onboarding/EnhancedWelcomeScreen';
import PermissionsSetupScreen from '../screens/onboarding/PermissionsSetupScreen';
import ProfilePhotoSetupScreen from '../screens/onboarding/ProfilePhotoSetupScreen';
import AppTutorialScreen from '../screens/onboarding/AppTutorialScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';


// Main Screens - Updated imports
import DashboardScreen from '../screens/main/Dashboard';
import FriendsScreen from '../screens/main/FriendsScreen';
import FriendRequestsScreenActual from '../screens/main/FriendRequestsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import EditProfileScreen from '../screens/main/profile/EditProfileScreen';
import ModernEditProfileScreen from '../screens/main/profile/ModernEditProfileScreen';
import ProfileQAReviewScreen from '../screens/main/profile/ProfileQAReviewScreen';
import MatchProfileScreen from '../screens/main/MatchProfileScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import ModernProfileScreen from '../screens/main/profile/ModernProfileScreen';
import MatchDetail from '../screens/main/MatchDetail';
import CommunityDetailScreen from '../components/communities/CommunityDetailScreen';
import CommunitiesScreen from '../components/communities/CommunitiesScreen';
import WorkflowGenealogyScreen from '../components/geneology/WorkflowGenealogyScreen';

// Chat Screens - Original Design
import ChatsPage from '../components/chat/ChatsPage';           
import ChatScreen from '../components/chat/ChatScreen';        
import AIAssistantScreen from '../components/chat/AIAssistantScreen';
import ConversationScreen from '../components/chat/ConversationsScreen';

// Status/Updates Screens
import StatusFeedScreen from '../screens/main/StatusFeedScreen';
import UpdatesScreen from '../screens/status/UpdatesScreen';

// Settings Screens - NEW IMPORTS
import SettingsScreen from '../components/settings/SettingsScreen';
import PrivacySettings from '../components/settings/PrivacySettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import HelpSupport from '../components/settings/HelpSupport';
import SendFeedback from '../components/settings/SendFeedback';
import DeleteAccount from '../components/settings/DeleteAccount';

// Safety Screens
import ReportUserScreen from '../screens/safety/ReportUserScreen';
import BlockedUsersScreen from '../screens/safety/BlockedUsersScreen';
import ContentFiltersScreen from '../screens/safety/ContentFiltersScreen';

// Connection Screens
// FriendRequestsScreen imported from main folder above

const Stack = createNativeStackNavigator();

// Loading Screen Component
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Import actual security screens
import TwoFactorSetupScreen from '../screens/security/TwoFactorSetupScreen';
import ActiveSessionsScreen from '../screens/security/ActiveSessionsScreen';
import LoginHistoryScreen from '../screens/security/LoginHistoryScreen';

const DeactivateAccountPlaceholder: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Deactivate Account</Text>
    <Text style={styles.placeholderSubtext}>Coming Soon</Text>
  </View>
);

const FamilyPlaceholder: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Family Tree</Text>
    <Text style={styles.placeholderSubtext}>Coming Soon</Text>
  </View>
);

const FindContactsPlaceholder: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Find Contacts</Text>
    <Text style={styles.placeholderSubtext}>Coming Soon</Text>
  </View>
);

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false); // Start with false to show splash immediately
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Splash'); // Always start with Splash
  const { theme } = useTheme();
  
  // Create custom dark theme for navigation
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };

  useEffect(() => {
    // Quick auth check after splash screen navigation starts
    const quickAuthCheck = async () => {
      try {
        // Quick auth check starting
        const storedData = await AuthStorage.getStoredData();

        if (storedData.auth && storedData.auth.isAuthenticated && storedData.user) {
          // User is authenticated - we can update this after splash shows
          const { setUser, setTokens } = useAuthStore.getState();
          
          setUser(storedData.user);
          if (storedData.auth.token) {
            setTokens(storedData.auth.token, storedData.auth.refreshToken || '');
          }
          
          setIsAuthenticated(true);
          // Auth restored
          
          // Note: We don't change initialRoute here - let splash handle the flow
        } else {
          setIsAuthenticated(false);
          // No auth found
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };

    // Run auth check after a brief delay to ensure splash loads first
    const timer = setTimeout(quickAuthCheck, 100);
    return () => clearTimeout(timer);
  }, []);

  // Navigation rendering

  return (
      <NavigationContainer theme={customDarkTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        {/* ========== AUTH FLOW ========== */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* ========== ONBOARDING FLOW ========== */}
        <Stack.Screen name="UserInfo" component={UserInfoScreen} />
        <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
        <Stack.Screen name="EmailPassword" component={EmailPasswordScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="Congratulations" component={CongratulationsScreen} />
        <Stack.Screen name="SetupChoice" component={SetupChoiceScreen} />
        <Stack.Screen name="VoiceSetup" component={VoiceSetupScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        
        {/* ========== ENHANCED ONBOARDING FLOW ========== */}
        <Stack.Screen 
          name="EnhancedWelcome" 
          component={EnhancedWelcomeScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen 
          name="PermissionsSetup" 
          component={PermissionsSetupScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen 
          name="ProfilePhotoSetup" 
          component={ProfilePhotoSetupScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen 
          name="AppTutorial" 
          component={AppTutorialScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen 
          name="OnboardingComplete" 
          component={OnboardingCompleteScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="PersonalDetails"
          component={PersonalDetailsScreen}
        />

        {/* ========== PROFILE SETUP ========== */}
        <Stack.Screen
          name="ProfileSetupMode"
          component={ProfileSetupScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        
        <Stack.Screen
          name="ProgressiveProfile"
          component={ProgressiveProfileScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="UnifiedOnboarding"
          component={UnifiedOnboardingScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen
          name="OnboardingCompletion"
          component={OnboardingCompletionScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== MAIN APP ========== */}
        <Stack.Screen
          name="MainApp"
          component={DashboardScreen}
          options={{
            headerShown: false,
            animation: 'none', // No animation for tab switching
            gestureEnabled: false // Prevent going back to onboarding
          }}
        />

        {/* ========== MAIN APP TABS ========== */}
        <Stack.Screen
          name="Friends"
          component={FriendsScreen}
          options={{
            headerShown: false,
            animation: 'none', // No animation for tab switching
            gestureEnabled: false // Disable swipe for tab navigation
          }}
        />
        
        <Stack.Screen
          name="Communities"
          component={CommunitiesScreen}
          options={{
            headerShown: false,
            animation: 'none', // No animation for tab switching
            gestureEnabled: false // Disable swipe for tab navigation
          }}
        />
        
        <Stack.Screen
          name="Chats"
          component={ChatsPage}
          options={{
            headerShown: false,
            animation: 'none', // No animation for tab switching
            gestureEnabled: false // Disable swipe for tab navigation
          }}
        />
        
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: false,
            animation: 'none', // No animation for tab switching
            gestureEnabled: false // Disable swipe for tab navigation
          }}
        />

        {/* ========== CONNECTION SCREENS ========== */}
        <Stack.Screen
          name="FriendRequests"
          component={FriendRequestsScreenActual}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== MATCH AND COMMUNITY DETAILS ========== */}
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetail}
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="CommunityDetail"
          component={CommunityDetailScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== PROFILE SCREENS ========== */}
        <Stack.Screen
          name="Profile"
          component={ModernProfileScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom'
          }}
        />

        <Stack.Screen
          name="EditProfile"
          component={ModernEditProfileScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="MatchProfile"
          component={MatchProfileScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="UserProfile"
          component={ModernProfileScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="ProfileQAReview"
          component={ProfileQAReviewScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="GenealogyDashboard"
          component={WorkflowGenealogyScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== CHAT SCREENS - Original Design ========== */}
        {/* ChatsPage - Shows list of recent chats */}
        <Stack.Screen
          name="ChatsPage"
          component={ChatsPage}
          options={{
            headerShown: false,
            animation: 'none', // No animation for tab switching
            gestureEnabled: false // Disable swipe for tab navigation
          }}
        />

        {/* ChatScreen - Individual chat conversation */}
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* Legacy Chat route - redirect to ChatsPage */}
        <Stack.Screen
          name="Chat"
          component={ChatsPage}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== STATUS/UPDATES SCREENS ========== */}
        <Stack.Screen
          name="StatusFeed"
          component={StatusFeedScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="Updates"
          component={UpdatesScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="AIAssistant"
          component={AIAssistantScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="Conversation"
          component={ConversationScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />


        {/* ========== SETTINGS SCREENS - NEW ADDITIONS ========== */}
        <Stack.Screen
          name="PrivacySettings"
          component={PrivacySettings}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="SecuritySettings"
          component={SecuritySettings}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="HelpSupport"
          component={HelpSupport}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="SendFeedback"
          component={SendFeedback}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="DeleteAccount"
          component={DeleteAccount}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: false // Prevent accidental back swipe during deletion
          }}
        />

        {/* ========== SAFETY SCREENS ========== */}
        <Stack.Screen
          name="ReportUser"
          component={ReportUserScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="BlockedUsers"
          component={BlockedUsersScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="ContentFilters"
          component={ContentFiltersScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== ADDITIONAL SETTINGS PLACEHOLDERS ========== */}
        {/* These are for future implementation */}
        <Stack.Screen
          name="TwoFactorSetup"
          component={TwoFactorSetupScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="ActiveSessions"
          component={ActiveSessionsScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="LoginHistory"
          component={LoginHistoryScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="DeactivateAccount"
          component={DeactivateAccountPlaceholder}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* ========== PLACEHOLDER SCREENS ========== */}
        <Stack.Screen
          name="Family"
          component={FamilyPlaceholder}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        <Stack.Screen
          name="FindContacts"
          component={FindContactsPlaceholder}
          options={{ headerShown: false }}
        />

        {/* REMOVED: The placeholder CommunityDetail screen that was conflicting */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#ffffff',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6b7280',
  },
});

export default AppNavigator;