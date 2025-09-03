// src/components/dashboard/DashboardTabs.tsx - Advanced Liquid Morphing Design
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path, Circle } from 'react-native-svg';
import { getSystemFont } from '../../config/constants';

const { width } = Dimensions.get('window');

interface Tab {
  id: string;
  title: string;
  icon: string;
}

interface DashboardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  activeTab,
  onTabPress
}) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  // Advanced Animations
  const morphAnimation = useRef(new Animated.Value(activeIndex)).current;
  const scaleAnimations = useRef(tabs.map(() => new Animated.Value(0))).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Morphing liquid animation
    Animated.spring(morphAnimation, {
      toValue: activeIndex,
      useNativeDriver: false,
      tension: 150,
      friction: 12,
      velocity: 2,
    }).start();

    // Scale animations for each tab
    scaleAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === activeIndex ? 1 : 0,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
    });

    // Continuous glow effect
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

    // Ripple effect on tab change
    rippleAnimation.setValue(0);
    Animated.timing(rippleAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const handleTabPress = (tabId: string, index: number) => {
    // Trigger ripple animation
    rippleAnimation.setValue(0);
    Animated.timing(rippleAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    onTabPress(tabId);
  };
  
  // Liquid morphing background component
  const LiquidBackground = () => {
    const tabWidth = width / tabs.length;
    
    return (
      <Animated.View style={styles.liquidContainer}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <SvgLinearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="rgba(0,145,173,0.25)" />
              <Stop offset="50%" stopColor="rgba(4,167,199,0.20)" />
              <Stop offset="100%" stopColor="rgba(252,211,170,0.15)" />
            </SvgLinearGradient>
          </Defs>
          
          <Animated.View
            style={{
              position: 'absolute',
              width: tabWidth + 40,
              height: '100%',
              left: morphAnimation.interpolate({
                inputRange: [0, tabs.length - 1],
                outputRange: [-20, width - tabWidth + 20],
                extrapolate: 'clamp',
              }),
            }}
          >
            <Path
              d={`M20,0 Q0,0 0,20 L0,${60-20} Q0,${60} 20,${60} L${tabWidth+20},${60} Q${tabWidth+40},${60} ${tabWidth+40},${60-20} L${tabWidth+40},20 Q${tabWidth+40},0 ${tabWidth+20},0 Z`}
              fill="url(#liquidGradient)"
              opacity={0.8}
            />
          </Animated.View>
        </Svg>
      </Animated.View>
    );
  };

  return (
    <View style={styles.transparentTabContainer}>
      {/* Transparent Tab Items */}
      <View style={styles.transparentTabsContainer}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.transparentTab, { width: width / tabs.length }]}
              onPress={() => handleTabPress(tab.id, index)}
              activeOpacity={0.8}
            >
              <View style={styles.transparentTabWrapper}>
                
                {/* Simple Ripple Effect */}
                <Animated.View 
                  style={[
                    styles.transparentRipple,
                    {
                      opacity: isActive ? rippleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 0],
                      }) : 0,
                      transform: [{
                        scale: rippleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.5],
                        }),
                      }],
                    }
                  ]}
                />

                {/* Tab Content */}
                <View style={styles.transparentTabContent}>

                  {/* Clean Typography */}
                  <Animated.Text 
                    style={[
                      styles.transparentTabText,
                      isActive && styles.activeTransparentTabText,
                      {
                        transform: [{
                          scale: scaleAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.03],
                          }),
                        }],
                      }
                    ]}
                  >
                    {tab.title}
                  </Animated.Text>
                  
                  {/* Gradient Line like Match Dividers */}
                  {isActive && (
                    <Animated.View 
                      style={[
                        styles.gradientLine,
                        {
                          opacity: scaleAnimations[index],
                          transform: [{
                            scaleX: scaleAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            })
                          }],
                        }
                      ]}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
                        style={styles.gradientLineInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </Animated.View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Separator */}
      <View style={styles.bottomSeparator}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.08)', 'transparent']}
          style={styles.separatorGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Transparent Tab Container
  transparentTabContainer: {
    position: 'relative',
    height: 60,
    width: '100%',
    backgroundColor: 'transparent',
  },
  
  // Transparent Tab Items
  transparentTabsContainer: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  
  transparentTab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  
  transparentTabWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Simple Ripple Effect
  transparentRipple: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 145, 173, 0.08)',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    zIndex: 1,
  },
  
  // Tab Content
  transparentTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    paddingVertical: 16,
    zIndex: 2,
  },
  
  // Transparent Typography
  transparentTabText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  
  activeTransparentTabText: {
    color: '#ffffff',
    fontFamily: getSystemFont('bold'),
    letterSpacing: 0.5,
  },
  
  liquidContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  // Gradient Line like Match Dividers
  gradientLine: {
    position: 'absolute',
    bottom: 10,
    height: 2,
    width: 40,
    alignSelf: 'center',
    borderRadius: 1,
  },
  
  gradientLineInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 1,
  },
  
  // Bottom Separator
  bottomSeparator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  separatorGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default DashboardTabs;