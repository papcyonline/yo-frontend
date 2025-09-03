import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface VoiceSetupScreenProps {
  navigation: any;
}

const VoiceSetupScreen: React.FC<VoiceSetupScreenProps> = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStep, setRecordingStep] = useState(0);

  const questions = [
    "Tell us your name and where you're from",
    "What's your family background?", 
    "What are your hobbies and interests?",
    "What are you looking for in this app?"
  ];

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement actual voice recording
    setTimeout(() => {
      setIsRecording(false);
      if (recordingStep < questions.length - 1) {
        setRecordingStep(recordingStep + 1);
      } else {
        Alert.alert(
          'Voice Setup Complete!',
          'Your voice responses have been recorded.',
          [{ text: 'Continue', onPress: () => navigation.navigate('Welcome') }]
        );
      }
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Voice Setup</Text>
          <Text style={styles.subtitle}>Step {recordingStep + 1} of {questions.length}</Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.question}>{questions[recordingStep]}</Text>
        </View>

        <View style={styles.recordingContainer}>
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={handleStartRecording}
            disabled={isRecording}
          >
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                <Ionicons name="stop" size={48} color="#ffffff" />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
            ) : (
              <Ionicons name="mic" size={48} color="#ffffff" />
            )}
          </TouchableOpacity>
          
          {!isRecording && (
            <Text style={styles.recordingInstruction}>Tap to start recording your answer</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.navigate('ManualSetup')}
        >
          <Text style={styles.skipText}>Switch to Manual Setup</Text>
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
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
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
  },
  subtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#15803d',
  },
  questionContainer: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 16,
    marginBottom: 48,
  },
  question: {
    fontSize: 18,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  recordingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingButton: {
    backgroundColor: '#dc2626',
  },
  recordingIndicator: {
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginTop: 8,
  },
  recordingInstruction: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
  },
  skipButton: {
    alignItems: 'center',
    marginBottom: 40,
  },
  skipText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
});

export default VoiceSetupScreen;