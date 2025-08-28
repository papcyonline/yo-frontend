import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainStackParamList } from './types';
import TabNavigator from './TabNavigator';

// Import additional screens
import MatchDetailsScreen from '../screens/matching/MatchDetailsScreen';
import CommunityDetailScreen from '../components/communities/CommunityDetailScreen';
import ChatScreen from '../components/chat/ChatScreen';
import AIAssistantScreen from '../components/chat/AIAssistantScreen';
import SettingsScreen from '../components/settings/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import CreateCommunityScreen from '../screens/communities/CreateCommunityScreen';
import ConnectSocialScreen from '../screens/social/ConnectSocialScreen';
import PrivacySettingsScreen from '../screens/social/PrivacySettingsScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MatchDetails" 
        component={MatchDetailsScreen} 
      />
      <Stack.Screen 
        name="CommunityDetails" 
        component={CommunityDetailScreen} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
      />
      <Stack.Screen 
        name="AIAssistant" 
        component={AIAssistantScreen} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
      />
      <Stack.Screen 
        name="CreateCommunity" 
        component={CreateCommunityScreen} 
      />
      <Stack.Screen 
        name="ConnectSocial" 
        component={ConnectSocialScreen} 
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={PrivacySettingsScreen} 
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;