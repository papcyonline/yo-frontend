//VoiceAssistantView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect, Circle as SvgCircle } from 'react-native-svg';
import { aiVoiceService, ConversationState } from '../../services/aiVoiceService';

interface VoiceAssistantViewProps {
  handleSkip: () => void;
  handleSubmit: () => void;
  userToken: string;
}

const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  handleSkip,
  handleSubmit,
  userToken
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    step: 0,
    extractedData: { completionPercentage: 0 },
    conversationHistory: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Animation refs
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const waveAnim4 = useRef(new Animated.Value(0)).current;
  const waveAnim5 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Initialize conversation when component mounts
  useEffect(() => {
    initializeConversation();
    return () => {
      aiVoiceService.cleanup();
    };
  }, []);

  const initializeConversation = async () => {
    try {
      // Get the first question from the chatflow system
      const response = await fetch(`${aiVoiceService.apiBaseUrl}/api/ai/chatflow/next-question`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success && !result.data.completed) {
        const question = result.data.question;
        setCurrentQuestion(question);
        setCompletionPercentage(result.data.completionPercentage || 0);
        setAiMessage(`Hello! I'm your AI assistant. I'll help you complete your family profile by asking some questions. Since I already have your basic information from signup, let's focus on building a comprehensive family profile. ${question.question}`);
      } else if (result.data.completed) {
        setAiMessage("Congratulations! Your profile is already complete! You're ready to start finding family connections.");
        setCompletionPercentage(100);
        setTimeout(() => {
          handleSubmit();
        }, 2000);
      } else {
        setAiMessage("Hello! I'm your AI assistant. I'm here to help you complete your family profile. Let's get started!");
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      setAiMessage("Hello! I'm your AI assistant. I'm here to help you complete your family profile. Let's get started!");
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    if (isListening) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const startAnimations = () => {
    const createWaveAnimation = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 800 + Math.random() * 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 800 + Math.random() * 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.stagger(150, [
      createWaveAnimation(waveAnim1),
      createWaveAnimation(waveAnim2),
      createWaveAnimation(waveAnim3),
      createWaveAnimation(waveAnim4),
      createWaveAnimation(waveAnim5),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    [waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5].forEach(anim => {
      anim.stopAnimation();
      anim.setValue(0);
    });
    glowAnim.stopAnimation();
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleMicPress = async () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setIsProcessing(true);
      
      try {
        const audioUri = await aiVoiceService.stopRecording();
        if (audioUri) {
          await processVoiceInput(audioUri);
        } else {
          setIsProcessing(false);
          Alert.alert('Error', 'Failed to record audio. Please try again.');
        }
      } catch (error) {
        setIsProcessing(false);
        console.error('Recording error:', error);
        Alert.alert('Error', 'Failed to process recording. Please try again.');
      }
    } else {
      // Start listening
      const started = await aiVoiceService.startRecording();
      if (started) {
        setIsListening(true);
      } else {
        Alert.alert(
          'Microphone Permission',
          'Please allow microphone access to use voice assistant.',
          [
            { text: 'Cancel' },
            { text: 'Settings', onPress: () => {
              // You could open app settings here
            }}
          ]
        );
      }
    }
  };

  const processVoiceInput = async (audioUri: string) => {
    try {
      const result = await aiVoiceService.processVoiceInput(
        audioUri,
        conversationState,
        userToken
      );

      if (result.success) {
        // Update conversation state
        const newCompletionPercentage = result.extractedData?.completionPercentage || result.completionPercentage || completionPercentage;
        
        setConversationState(prev => ({
          step: result.nextStep || prev.step + 1,
          extractedData: { ...prev.extractedData, ...result.extractedData, currentQuestionId: result.extractedData?.currentQuestionId },
          conversationHistory: [
            ...prev.conversationHistory,
            {
              role: 'user',
              content: result.transcript || 'Voice input',
              timestamp: new Date()
            },
            {
              role: 'assistant',
              content: result.aiResponse || '',
              timestamp: new Date()
            }
          ]
        }));

        // Update completion percentage
        setCompletionPercentage(newCompletionPercentage);

        // Update AI message
        if (result.aiResponse) {
          setAiMessage(result.aiResponse);
        }

        // Check if conversation is complete
        if (result.isComplete || newCompletionPercentage >= 100) {
          setAiMessage("Perfect! Your profile is now complete. You're ready to start finding family connections!");
          setCompletionPercentage(100);
          setTimeout(() => {
            handleSubmit();
          }, 2000);
        }
      } else {
        setAiMessage(result.error || "I didn't quite catch that. Could you please try again?");
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setAiMessage("Sorry, I had trouble understanding. Let's try that again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getMicIconName = () => {
    if (isProcessing) return 'cog-outline';
    if (isListening) return 'mic';
    return 'mic-outline';
  };

  const getMicButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Tap to stop';
    return 'Tap to speak';
  };

  const getStatusText = () => {
    if (isProcessing) return '🤖 AI is processing your response...';
    if (isListening) return '🎤 Listening... Speak naturally';
    return 'Ready to listen';
  };

  return (
    <View style={styles.container}>
      {/* Dotted Background */}
      <View style={styles.dottedBackground}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern
              id="dots3"
              patternUnits="userSpaceOnUse"
              width="20"
              height="20"
            >
              <SvgCircle
                cx="10"
                cy="10"
                r="1"
                fill="rgba(255, 255, 255, 0.1)"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots3)" />
        </Svg>
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip setup</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            AI Voice Assistant • {completionPercentage}% Complete
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
        </View>

        {/* AI Message */}
        <View style={styles.messageContainer}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={24} color="#0091ad" />
          </View>
          <View style={styles.messageBubble}>
            <Text style={styles.aiMessage}>{aiMessage}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {/* Voice Tips */}
        {!isListening && !isProcessing && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Speaking Tips:</Text>
            <Text style={styles.tipText}>• Speak clearly and naturally</Text>
            <Text style={styles.tipText}>• It's okay to pause and think</Text>
            <Text style={styles.tipText}>• Say "I don't know" if you're unsure</Text>
            <Text style={styles.tipText}>• Feel free to tell stories!</Text>
          </View>
        )}
      </View>

      {/* Voice Interface */}
      <View style={styles.voiceInterface}>
        <Animated.View style={[styles.glowEffect, { opacity: glowAnim }]} />
        
        <TouchableOpacity 
          style={[
            styles.micContainer,
            isListening && styles.micContainerActive,
            isProcessing && styles.micContainerProcessing
          ]}
          onPress={handleMicPress}
          disabled={!isInitialized}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons 
              name={getMicIconName() as any}
              size={40} 
              color="#0091ad" 
            />
          </Animated.View>
        </TouchableOpacity>

        {isListening && (
          <View style={styles.waveContainer}>
            {[waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5].map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    transform: [{
                      scaleY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1.5],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
        )}
        
        <Text style={styles.instruction}>{getMicButtonText()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 2,
  },
  dottedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    opacity: 0.3,
  },
  skipButton: { 
    position: 'absolute', 
    top: 50, 
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  skipText: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: 'rgba(252, 211, 170, 0.7)',
    textDecorationLine: 'underline',
  },

  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: 100, 
    paddingBottom: 220,
  },

  // Progress
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#04a7c7',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0091ad',
    borderRadius: 2,
  },

  // Message
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#0091ad',
  },
  messageBubble: {
    flex: 1,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
  },
  aiMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fcd3aa',
    lineHeight: 22,
  },

  // Status
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(252, 211, 170, 0.8)',
    textAlign: 'center',
  },

  // Tips
  tipsContainer: {
    backgroundColor: 'rgba(0, 145, 173, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.1)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#04a7c7',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.8)',
    marginBottom: 4,
  },

  // Voice Interface
  voiceInterface: { 
    position: 'absolute', 
    bottom: 80, 
    left: 0, 
    right: 0, 
    alignItems: 'center',
    zIndex: 3,
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0091ad',
    opacity: 0.15,
  },
  micContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(252, 211, 170, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0091ad',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micContainerActive: {
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    borderColor: '#04a7c7',
  },
  micContainerProcessing: {
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
    borderColor: '#fcd3aa',
  },
  waveContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    height: 50, 
    marginTop: 20,
    gap: 3,
  },
  waveBar: { 
    width: 4, 
    height: 20, 
    backgroundColor: '#0091ad', 
    borderRadius: 2,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(252, 211, 170, 0.8)',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default VoiceAssistantView;