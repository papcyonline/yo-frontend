import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'network';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showIcon?: boolean;
  customIcon?: string;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
  autoHide = false,
  autoHideDelay = 3000,
  showIcon = true,
  customIcon,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide if enabled
      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#22c55e',
          gradientColors: ['#22c55e', '#16a34a'],
          borderColor: '#22c55e',
        };
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: '#ef4444',
          gradientColors: ['#ef4444', '#dc2626'],
          borderColor: '#ef4444',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#f59e0b',
          gradientColors: ['#f59e0b', '#d97706'],
          borderColor: '#f59e0b',
        };
      case 'network':
        return {
          icon: 'wifi-outline',
          iconColor: '#ef4444',
          gradientColors: ['#ef4444', '#dc2626'],
          borderColor: '#ef4444',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          iconColor: '#3b82f6',
          gradientColors: ['#3b82f6', '#2563eb'],
          borderColor: '#3b82f6',
        };
    }
  };

  const config = getAlertConfig();
  const iconName = customIcon || config.icon;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1}
          onPress={handleDismiss}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
                  style={styles.gradientBackground}
                />
                
                <View style={styles.contentContainer}>
                  {/* Animated border */}
                  <View style={[styles.animatedBorder, { borderColor: config.borderColor }]} />
                  
                  {/* Icon */}
                  {showIcon && (
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={config.gradientColors as any}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons 
                          name={iconName as any} 
                          size={32} 
                          color="#ffffff" 
                        />
                      </LinearGradient>
                    </View>
                  )}

                  {/* Title */}
                  <Text style={styles.title}>{title}</Text>

                  {/* Message */}
                  {message && (
                    <Text style={styles.message}>{message}</Text>
                  )}

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    {buttons.map((button, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          button.style === 'cancel' && styles.cancelButton,
                          button.style === 'destructive' && styles.destructiveButton,
                          index > 0 && styles.buttonMargin,
                        ]}
                        onPress={() => {
                          button.onPress?.();
                          handleDismiss();
                        }}
                      >
                        <LinearGradient
                          colors={
                            (button.style === 'destructive' 
                              ? ['#ef4444', '#dc2626']
                              : button.style === 'cancel'
                              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                              : config.gradientColors) as any
                          }
                          style={styles.buttonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={[
                            styles.buttonText,
                            button.style === 'cancel' && styles.cancelButtonText
                          ]}>
                            {button.text}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
  },
  animatedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopWidth: 3,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  button: {
    minWidth: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  destructiveButton: {
    // Styles handled by gradient
  },
  buttonMargin: {
    marginLeft: 12,
  },
});

export default CustomAlert;