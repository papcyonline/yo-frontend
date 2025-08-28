import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export const NetworkStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected && state.isInternetReachable;
      
      // Only show status when connection changes (not on initial load)
      if (connected !== isConnected && isConnected !== null) {
        setShowStatus(true);
        
        // Animate in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Auto-hide after 2 seconds (shorter duration)
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowStatus(false));
        }, 2000);
      }

      setIsConnected(connected);
      setConnectionType(state.type);
    });

    // Initial check - don't show status on app startup
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      setConnectionType(state.type);
      // Don't show status indicator on initial load
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  if (!showStatus) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isConnected ? styles.connected : styles.disconnected,
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isConnected ? 'wifi' : 'cloud-offline'}
          size={16}
          color="#ffffff"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {isConnected
            ? `Connected${connectionType !== 'unknown' ? ` (${connectionType})` : ''}`
            : 'No Internet Connection'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  connected: {
    backgroundColor: '#10b981',
  },
  disconnected: {
    backgroundColor: '#ef4444',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});