// Clean Voice Profile Collection Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

// Note: In real implementation, you would use react-native-voice
// import Voice from '@react-native-voice/voice';

const { width } = Dimensions.get('window');

interface VoiceProfileProps {
  navigation: any;
  route: any;
}

interface VoiceQuestion {
  id: string;
  question: string;
  followUp?: string;
  category: string;
  expectedDuration: number; // seconds
}

const voiceQuestions: VoiceQuestion[] = [
  {
    id: 'introduction',
    question: "Hi! I'm your AI assistant. Tell me a bit about yourself - what's your name and what brings you here today?",
    followUp: "That's wonderful! Can you tell me more about your background?",
    category: 'basic',
    expectedDuration: 30
  },
  {
    id: 'family_background',
    question: "Now, let's talk about your family. Where does your family come from? Share any stories you know about your heritage.",
    followUp: "That's fascinating! Are there any family traditions that are important to you?",
    category: 'family',
    expectedDuration: 60
  },
  {
    id: 'life_story',
    question: "Tell me about your life journey - your career, education, what you're passionate about, and what makes you unique.",
    followUp: "Great! What do you love doing in your free time?",
    category: 'personal',
    expectedDuration: 60
  },
  {
    id: 'connections',
    question: "What kind of connections are you hoping to make? Are you looking for family members, friends, or community?",
    followUp: "Perfect! Is there anything specific you'd like people to know about you?",
    category: 'preferences',
    expectedDuration: 30
  },
  {
    id: 'family_stories',
    question: "Do you have any interesting family stories, migration tales, or memories from relatives that you'd like to share?",
    followUp: "Thank you for sharing! That will really help us find great matches for you.",
    category: 'stories',
    expectedDuration: 90
  }
];

const VoiceProfileScreen: React.FC<VoiceProfileProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionProgress, setSessionProgress] = useState(0);
  
  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Initialize voice recognition
    initializeVoice();
    
    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: sessionProgress,
      duration: 800,
      easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
      useNativeDriver: false,
    }).start();

    return () => {
      // Cleanup voice
      // Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const initializeVoice = () => {
    // Voice.onSpeechStart = onSpeechStart;
    // Voice.onSpeechRecognized = onSpeechRecognized;
    // Voice.onSpeechEnd = onSpeechEnd;
    // Voice.onSpeechError = onSpeechError;
    // Voice.onSpeechResults = onSpeechResults;
    // Voice.onSpeechPartialResults = onSpeechPartialResults;
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.sine),
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setTranscribedText('');
      
      // In real implementation:
      // await Voice.start('en-US');
      
      // Simulate voice recognition for demo
      setTimeout(() => {
        simulateVoiceInput();
      }, 3000);
      
    } catch (error) {
      console.error('Voice start error:', error);
      setIsListening(false);
      Alert.alert('Voice Error', 'Could not start voice recognition. Please check your microphone permissions.');
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);
      
      // In real implementation:
      // await Voice.stop();
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        setEditMode(true);
      }, 1500);
      
    } catch (error) {
      console.error('Voice stop error:', error);
      setIsProcessing(false);
    }
  };

  // Simulate voice input for demo purposes
  const simulateVoiceInput = () => {
    const currentQuestion = voiceQuestions[currentQuestionIndex];
    let demoText = '';
    
    switch (currentQuestion.id) {
      case 'introduction':
        demoText = "Hi, my name is Sarah Johnson. I'm here because I want to connect with family members and learn more about my heritage. I've always been curious about my family's history and would love to find relatives I haven't met yet.";
        break;
      case 'family_background':
        demoText = "My family comes from Lebanon originally. My grandparents immigrated to the United States in the 1940s. They settled in Michigan and started a small grocery store. We still celebrate Lebanese holidays and my grandmother taught me how to make traditional dishes like kibbeh and tabbouleh.";
        break;
      case 'life_story':
        demoText = "I'm a teacher by profession, working with elementary school kids for the past 8 years. I studied Education at the University of Michigan. I'm passionate about helping children learn and grow. In my free time, I love reading, hiking, and cooking traditional Lebanese food that my grandmother taught me.";
        break;
      case 'connections':
        demoText = "I'm primarily looking for family members, especially cousins or distant relatives who might share similar family stories. I'd also love to connect with people who have Lebanese heritage and might know about the same traditions or even the same villages my family came from.";
        break;
      case 'family_stories':
        demoText = "My grandfather used to tell stories about life in Lebanon before they immigrated. He talked about olive groves and how the whole family would work together during harvest season. He also mentioned they had a relative who was a famous poet in their village. I'd love to learn more about these connections and maybe find relatives who remember similar stories.";
        break;
      default:
        demoText = "This is a simulated voice response for demonstration purposes.";
    }
    
    // Simulate real-time transcription
    let currentText = '';
    const words = demoText.split(' ');
    let wordIndex = 0;
    
    const addWord = () => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setTranscribedText(currentText);
        wordIndex++;
        setTimeout(addWord, 150 + Math.random() * 100);
      } else {
        setTimeout(() => {
          setIsListening(false);
          setIsProcessing(true);
          setTimeout(() => {
            setIsProcessing(false);
            setEditMode(true);
          }, 1500);
        }, 1000);
      }
    };
    
    addWord();
  };

  const handleEditComplete = () => {
    const currentQuestion = voiceQuestions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: transcribedText
    }));
    
    setEditMode(false);
    setTranscribedText('');
    
    const newProgress = ((currentQuestionIndex + 1) / voiceQuestions.length) * 100;
    setSessionProgress(newProgress);
    
    if (currentQuestionIndex < voiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
    Alert.alert(
      '🎉 Great Job!',
      'Your voice session is complete! We\'ll now process your responses to create your profile.',
      [
        {
          text: 'Finish',
          onPress: () => {
            // In real app, send answers to AI processing
            navigation.goBack();
          }
        }
      ]
    );
  };

  const currentQuestion = voiceQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / voiceQuestions.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern
              id="voiceDots"
              patternUnits="userSpaceOnUse"
              width="30"
              height="30"
            >
              <Circle cx="15" cy="15" r="0.8" fill="rgba(0,145,173,0.08)" opacity="0.6" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#voiceDots)" />
        </Svg>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Voice Profile</Text>
          <Text style={styles.headerSubtitle}>Question {currentQuestionIndex + 1} of {voiceQuestions.length}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              }
            ]}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.questionCardGradient}
          >
            <View style={styles.questionHeader}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#0091ad" />
              <Text style={styles.questionCategory}>{currentQuestion.category}</Text>
            </View>
            
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            
            <View style={styles.expectedDuration}>
              <Ionicons name="time-outline" size={16} color="rgba(252,211,170,0.7)" />
              <Text style={styles.expectedDurationText}>
                ~{currentQuestion.expectedDuration} seconds
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Voice Control */}
        <View style={styles.voiceControlContainer}>
          {!editMode && !isProcessing && (
            <View style={styles.voiceControl}>
              <TouchableOpacity
                style={styles.microphoneButton}
                onPress={isListening ? stopListening : startListening}
                disabled={isProcessing}
              >
                <Animated.View
                  style={[
                    styles.microphoneButtonInner,
                    {
                      transform: [{ scale: pulseAnim }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={isListening ? ['#ff6b6b', '#ff5252'] : ['#0091ad', '#04a7c7']}
                    style={styles.microphoneGradient}
                  >
                    <Ionicons 
                      name={isListening ? "stop" : "mic"} 
                      size={32} 
                      color="#ffffff" 
                    />
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
              
              <Text style={styles.voiceInstructions}>
                {isListening ? 'Tap to stop recording' : 'Tap to start speaking'}
              </Text>
              
              {isListening && (
                <View style={styles.listeningIndicator}>
                  <Text style={styles.listeningText}>Listening...</Text>
                  <View style={styles.waveContainer}>
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <Animated.View
                        key={bar}
                        style={[
                          styles.waveBar,
                          {
                            height: waveAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [4, 20],
                            }),
                            opacity: waveAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.3, 1, 0.3],
                            }),
                          }
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {isProcessing && (
            <View style={styles.processingContainer}>
              <View style={styles.processingIcon}>
                <Ionicons name="cog" size={32} color="#0091ad" />
              </View>
              <Text style={styles.processingText}>Processing your response...</Text>
            </View>
          )}
        </View>

        {/* Transcription Display */}
        {transcribedText && (
          <View style={styles.transcriptionContainer}>
            <View style={styles.transcriptionHeader}>
              <Ionicons name="document-text" size={20} color="#fcd3aa" />
              <Text style={styles.transcriptionTitle}>Your Response</Text>
              {editMode && (
                <TouchableOpacity
                  style={styles.editToggle}
                  onPress={() => setEditMode(!editMode)}
                >
                  <Ionicons name="create" size={16} color="#0091ad" />
                </TouchableOpacity>
              )}
            </View>
            
            {editMode ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={transcribedText}
                  onChangeText={setTranscribedText}
                  multiline
                  placeholder="Edit your response..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  selectionColor="#fcd3aa"
                />
                
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleEditComplete}
                >
                  <LinearGradient
                    colors={['#0091ad', '#04a7c7']}
                    style={styles.confirmButtonGradient}
                  >
                    <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.transcriptionText}>{transcribedText}</Text>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252,211,170,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252,211,170,0.7)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  questionCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  questionCardGradient: {
    padding: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0091ad',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 26,
    marginBottom: 16,
  },
  expectedDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expectedDurationText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(252,211,170,0.7)',
    marginLeft: 6,
  },
  voiceControlContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  voiceControl: {
    alignItems: 'center',
  },
  microphoneButton: {
    marginBottom: 20,
  },
  microphoneButtonInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  microphoneGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceInstructions: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  listeningIndicator: {
    alignItems: 'center',
  },
  listeningText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0091ad',
    marginBottom: 12,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#0091ad',
    borderRadius: 2,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  processingIcon: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0091ad',
    textAlign: 'center',
  },
  transcriptionContainer: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
    padding: 20,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
    marginLeft: 8,
    flex: 1,
  },
  editToggle: {
    padding: 8,
  },
  transcriptionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    lineHeight: 24,
  },
  editContainer: {},
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default VoiceProfileScreen;