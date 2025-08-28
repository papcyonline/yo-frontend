// TabNavigator.tsx - Main bottom tab navigation
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import main screens
import Dashboard from '../screens/main/Dashboard';
import FamilyPage from '../screens/main/FamilyPage';
import ChatsPage from '../components/chat/ChatsPage';
import CommunitiesScreen from '../components/communities/CommunitiesScreen';
import FriendsScreen from '../screens/main/FriendsScreen';

// Import hooks
import { useUnreadChats } from '../hooks/useUnreadChats';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  const { unreadCount } = useUnreadChats();
  const { pendingCount } = useFriendRequests();
  const { user } = useAuthStore();

  const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Family':
        iconName = focused ? 'people' : 'people-outline';
        break;
      case 'Chats':
        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        break;
      case 'Communities':
        iconName = focused ? 'albums' : 'albums-outline';
        break;
      case 'Friends':
        iconName = focused ? 'person-add' : 'person-add-outline';
        break;
      default:
        iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  const getBadgeCount = (routeName: string) => {
    switch (routeName) {
      case 'Chats':
        return unreadCount > 0 ? unreadCount : undefined;
      case 'Friends':
        return pendingCount > 0 ? pendingCount : undefined;
      default:
        return undefined;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => 
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: '#0091ad',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: 'rgba(252,211,170,0.1)',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarBadge: getBadgeCount(route.name),
        tabBarBadgeStyle: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 'bold',
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          marginLeft: 4,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard}
        options={{
          tabBarLabel: 'Home',
        }}
        initialParams={{ user }}
      />
      
      <Tab.Screen 
        name="Family" 
        component={FamilyPage}
        options={{
          tabBarLabel: 'Family',
        }}
        initialParams={{ user }}
      />
      
      <Tab.Screen 
        name="Chats" 
        component={ChatsPage}
        options={{
          tabBarLabel: 'Chats',
        }}
        initialParams={{ user }}
      />
      
      <Tab.Screen 
        name="Communities" 
        component={CommunitiesScreen}
        options={{
          tabBarLabel: 'Groups',
        }}
        initialParams={{ user }}
      />
      
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          tabBarLabel: 'Friends',
        }}
        initialParams={{ user }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;