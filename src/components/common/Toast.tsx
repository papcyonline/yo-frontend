import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  message: string;
  position?: ToastPosition;
  duration?: number;
  onHide?: () => void;
  action?: {
    text: string;
    onPress: () => void;
  };
  compact?: boolean; // New prop for smaller style
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  type = 'info',
  message,
  position = 'top',
  duration = 3000,
  onHide,
  action,
  compact = false,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          gradientColors: ['#10b981', '#059669'],
          iconColor: '#ffffff',
        };
      case 'error':
        return {
          icon: 'close-circle',
          gradientColors: ['#ef4444', '#dc2626'],
          iconColor: '#ffffff',
        };
      case 'warning':
        return {
          icon: 'warning',
          gradientColors: ['#f59e0b', '#d97706'],
          iconColor: '#ffffff',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          gradientColors: ['#3b82f6', '#2563eb'],
          iconColor: '#ffffff',
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' 
          ? { top: insets.top + 10 } 
          : { bottom: insets.bottom + 10 },
        {
          transform: [
            { translateY },
            { scale }
          ],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={styles.touchable}
      >
        <LinearGradient
          colors={config.gradientColors as any}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.content, compact && styles.compactContent]}>
            <Ionicons
              name={config.icon as any}
              size={compact ? 18 : 24}
              color={config.iconColor}
              style={styles.icon}
            />
            <Text style={[styles.message, compact && styles.compactMessage]} numberOfLines={compact ? 1 : 2}>
              {message}
            </Text>
            {action && (
              <TouchableOpacity
                onPress={() => {
                  action.onPress();
                  hideToast();
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>{action.text}</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  compactContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  compactMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
});

export default Toast;