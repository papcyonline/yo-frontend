import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface MockRTCViewProps {
  streamURL?: string;
  style?: any;
  objectFit?: 'cover' | 'contain';
  mirror?: boolean;
  isLocal?: boolean;
}

export const MockRTCView: React.FC<MockRTCViewProps> = ({
  streamURL,
  style,
  objectFit = 'cover',
  mirror = false,
  isLocal = false
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={isLocal ? ['#1a1a2e', '#16213e'] : ['#0f0f23', '#1a1a2e']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons 
            name={isLocal ? "person" : "person-outline"} 
            size={40} 
            color="rgba(255,255,255,0.6)" 
          />
          <Text style={styles.label}>
            {isLocal ? 'Your Video' : 'Remote Video'}
          </Text>
          <Text style={styles.mockLabel}>
            Mock WebRTC View
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  mockLabel: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
});