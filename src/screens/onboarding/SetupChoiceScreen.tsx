import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface SetupChoiceScreenProps {
  navigation: any;
}

const SetupChoiceScreen: React.FC<SetupChoiceScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Setup Method</Text>
          <Text style={styles.subtitle}>How would you like to complete your profile?</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => navigation.navigate('VoiceSetup')}
          >
            <Ionicons name="mic" size={48} color="#15803d" />
            <Text style={styles.optionTitle}>Voice Setup</Text>
            <Text style={styles.optionDescription}>Tell us about yourself using voice</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => navigation.navigate('ManualSetup')}
          >
            <Ionicons name="create" size={48} color="#15803d" />
            <Text style={styles.optionTitle}>Manual Setup</Text>
            <Text style={styles.optionDescription}>Fill out forms manually</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 40,
  },
  skipText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
});

export default SetupChoiceScreen;