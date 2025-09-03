import React from 'react';
import { View, Text } from 'react-native';

export default function SimpleProfile() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', fontSize: 24 }}>Simple Profile</Text>
    </View>
  );
}