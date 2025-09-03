// src/components/dashboard/BottomNavigation.tsx - Modern Redesign
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

const { width } = Dimensions.get('window');

interface BottomNavigationProps {
  activeTab: string;
  onTabPress?: (tab: string) => void;
  navigation?: any;
  chatCount?: number;
  communityNotifications?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
  navigation,
  chatCount = 0,
  communityNotifications = 0
}) => {
  const { theme, isDark } = useTheme();
  
  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    modernContainer: {
      backgroundColor: theme.background,
      position: 'relative',
      paddingBottom: 20,
    },
    modernBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
    },
    tabText: {
      fontSize: 10,
      fontFamily: getSystemFont('medium'),
      color: theme.textSecondary,
      marginTop: 4,
    },
    activeTabText: {
      color: theme.accent,
    },
  });
  
  // Animation refs
  const scaleAnimations = useRef(
    Array(5).fill(0).map(() => new Animated.Value(1))
  ).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleTabPress = (tabId: string, index: number) => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnimations[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // If onTabPress is provided, use it (for dashboard internal navigation)
    if (onTabPress) {
      onTabPress(tabId);
    }
    
    // If navigation is provided, navigate to different screens
    if (navigation) {
      switch (tabId) {
        case 'family':
          // Navigate to Dashboard with family matches (correct screen name: MainApp)
          navigation.navigate('MainApp', { user: null });
          break;
        case 'friends':
          // Navigate to Friends page to show friends matches (correct screen name: Friends)
          navigation.navigate('Friends', { user: null });
          break;
        case 'community':
          // Navigate to Communities page to show joined communities (correct screen name: Communities)
          navigation.navigate('Communities', { user: null });
          break;
        case 'chats':
          // Navigate to Chats page (correct screen name: ChatsPage)
          navigation.navigate('ChatsPage', { user: null });
          break;
        case 'settings':
          // Navigate to Settings page (correct screen name: Settings)
          navigation.navigate('Settings', { user: null });
          break;
      }
    }
  };

  // Updated icons with Android compatibility
  const navigationItems = [
    {
      id: 'family',
      title: 'Family',
      icon: 'people-circle-outline',
      activeIcon: 'people-circle',
      badge: 0,
    },
    {
      id: 'friends',
      title: 'Friends', 
      icon: 'people-outline',
      activeIcon: 'people',
      badge: 0,
    },
    {
      id: 'community',
      title: 'Community',
      icon: 'earth-outline',
      activeIcon: 'earth',
      badge: communityNotifications,
    },
    {
      id: 'chats',
      title: 'Chats',
      icon: 'chatbubbles-outline',
      activeIcon: 'chatbubbles',
      badge: chatCount,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      activeIcon: 'settings',
      badge: 0,
    },
  ];

  return (
    <View style={dynamicStyles.modernContainer}>
      {/* Sleek Background */}
      <View style={dynamicStyles.modernBackground} />
      
      {/* Top Gradient Line */}
      <View style={styles.topGradientLine}>
        <LinearGradient
          colors={['transparent', 'rgba(252, 211, 170, 0.2)', 'rgba(0, 145, 173, 0.1)', 'transparent']}
          style={styles.topLineGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      
      <View style={styles.modernNavContainer}>
        {navigationItems.map((item, index) => {
          const isActive = activeTab === item.id;
         
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.modernNavItem,
                {
                  transform: [{ scale: scaleAnimations[index] }]
                }
              ]}
            >
              <TouchableOpacity
                style={[styles.modernTouchable, isActive && styles.activeTouchable]}
                onPress={() => handleTabPress(item.id, index)}
                activeOpacity={0.8}
                accessibilityLabel={`${item.title} ${isActive ? 'selected' : ''}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessible={true}
              >

                {/* Icon Container */}
                <View style={[styles.modernIconContainer, isActive && styles.activeIconContainer]}>
                  <Ionicons
                    name={isActive ? item.activeIcon as any : item.icon as any}
                    size={isActive ? 26 : 24}
                    color={isActive ? '#fcd3aa' : 'rgba(255, 255, 255, 0.7)'}
                    style={{ 
                      textAlignVertical: 'center',
                      includeFontPadding: false 
                    }}
                  />
                  
                  {/* Enhanced Badge */}
                  {item.badge > 0 && (
                    <Animated.View 
                      style={[
                        styles.modernBadge,
                        {
                          transform: [{
                            scale: glowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.1],
                            }),
                          }],
                        }
                      ]}
                    >
                      <Text style={styles.modernBadgeText}>
                        {item.badge > 99 ? '99+' : item.badge.toString()}
                      </Text>
                    </Animated.View>
                  )}
                </View>
               
                {/* Enhanced Typography */}
                <Text style={[
                  styles.modernNavText,
                  isActive ? styles.activeModernNavText : styles.inactiveModernNavText
                ]}>
                  {item.title}
                </Text>

                {/* Active Indicator Line */}
                {isActive && (
                  <View style={styles.activeIndicator}>
                    <LinearGradient
                      colors={['transparent', '#fcd3aa', 'transparent']}
                      style={styles.indicatorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Modern Safe Area */}
      <View style={styles.modernSafeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Modern Container - moved to dynamicStyles for theming
  // modernContainer and modernBackground now use theme colors
  
  // Top Gradient Line
  topGradientLine: {
    height: 2,
    marginBottom: 8,
  },
  
  topLineGradient: {
    flex: 1,
    height: '100%',
  },
  
  // Modern Navigation Container
  modernNavContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  // Modern Navigation Item
  modernNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  // Modern Touchable
  modernTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    position: 'relative',
    minHeight: Platform.OS === 'android' ? 60 : 64,
    overflow: 'hidden',
  },
  
  activeTouchable: {
    // Removed background - only indicator line remains
  },
  
  // Modern Icon Container
  modernIconContainer: {
    position: 'relative',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  
  // Modern Badge
  modernBadge: {
    position: 'absolute',
    top: Platform.OS === 'android' ? -4 : -6,
    right: Platform.OS === 'android' ? -4 : -6,
    backgroundColor: '#fcd3aa',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    elevation: Platform.OS === 'android' ? 8 : 4,
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  
  modernBadgeText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    color: '#000000',
  },
  
  // Modern Navigation Text
  modernNavText: {
    fontSize: 11,
    fontFamily: getSystemFont('medium'),
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  activeModernNavText: {
    color: '#fcd3aa',
    fontFamily: getSystemFont('bold'),
  },
  
  inactiveModernNavText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Active Indicator Line
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    height: 2,
    width: 32,
    borderRadius: 1,
  },
  
  indicatorGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
  },
  
  // Modern Safe Area
  modernSafeArea: {
    height: 8,
    backgroundColor: 'transparent',
  },
});

export default BottomNavigation;