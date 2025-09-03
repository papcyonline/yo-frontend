// Unified Onboarding Screen - New System
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

import { 
  unifiedOnboardingPhases,
  UnifiedQuestion,
  getNextRecommendedQuestion,
  calculateUnifiedCompletion,
  getTotalQuestions
} from '../CompleteProfile/unifiedOnboardingFlow';
import { unifiedOnboardingAPI } from '../../services/api/unifiedOnboarding';
import { useAuthStore } from '../../store/authStore';
import { AuthStorage } from '../../utils/AuthStorage';

const { width } = Dimensions.get('window');

interface UnifiedOnboardingProps {
  navigation: any;
  route: any;
}

const UnifiedOnboardingScreen: React.FC<UnifiedOnboardingProps> = ({ navigation, route }) => {
  const { user, userId, email, fullName } = route.params || {};
  
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentPhase, setCurrentPhase] = useState<'essential' | 'core' | 'rich' | 'completed'>('essential');
  const [progressValue, setProgressValue] = useState(0);
  
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'question' | 'answer', content: string, timestamp: number, questionId?: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-save registration data on component mount
  useEffect(() => {
    autoSaveRegistrationData();
    loadProgress();
    startConversation();
  }, []);

  useEffect(() => {
    // Update progress based on answered questions
    const completion = calculateUnifiedCompletion(answeredQuestions);
    setProgressValue(completion.percentage);
  }, [answeredQuestions]);

  const autoSaveRegistrationData = async () => {
    // Auto-save registration data from params to unified onboarding system
    if (email && fullName) {
      const registrationData = {
        email: email,
        full_name: fullName,
        // Add other registration fields if available from route params
      };

      try {
        console.log('🤖 Auto-saving registration data to unified onboarding...');
        
        const result = await unifiedOnboardingAPI.saveOnboardingBatch(
          registrationData,
          'essential',
          true
        );
        
        if (result && result.success) {
          console.log('✅ Registration data auto-saved to unified onboarding');
          // Update local state
          setAnswers(registrationData);
          setAnsweredQuestions(['email', 'full_name']);
          if (fullName) {
            setUserName(fullName.split(' ')[0] || fullName);
          }
        } else {
          console.log('❌ Failed to auto-save registration data:', result?.message);
        }
      } catch (error) {
        console.log('❌ Error auto-saving registration data:', error);
      }
    }
  };

  const loadProgress = async () => {
    try {
      // Load unified onboarding status from backend
      const result = await unifiedOnboardingAPI.getOnboardingResponses();
      
      if (result && result.success && result.data) {
        const savedAnswers = result.data.answers || {};
        const savedQuestions = Object.keys(savedAnswers);
        
        setAnswers(savedAnswers);
        setAnsweredQuestions(savedQuestions);
        setCurrentPhase(result.data.phase || 'essential');
        
        // Set username from answers or full_name
        if (savedAnswers.username) {
          setUserName(savedAnswers.username);
        } else if (savedAnswers.full_name) {
          setUserName(savedAnswers.full_name.split(' ')[0] || savedAnswers.full_name);
        }

        console.log(`✅ Loaded ${savedQuestions.length} previous answers from unified onboarding`);
      }
    } catch (error) {
      console.log('Failed to load unified onboarding progress:', error);
    }
  };

  const startConversation = () => {
    setTimeout(() => {
      const greeting = userName 
        ? `👋 Welcome ${userName}! I'm here to help you complete your profile using our new unified system.`
        : '👋 Hi there! I\'m here to help you complete your profile registration.';
      
      addBotMessage(greeting);
      
      setTimeout(() => {
        addBotMessage('🎯 I\'ll ask you questions that help us find your perfect matches - family members, friends, and community connections!');
        
        setTimeout(() => {
          // Get the first unanswered question
          const nextQuestion = getNextRecommendedQuestion(answeredQuestions);
          if (nextQuestion) {
            askQuestion(nextQuestion);
          } else {
            handleOnboardingComplete();
          }
        }, 2000);
      }, 1500);
    }, 1000);
  };

  const addBotMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      type: 'question' as const,
      content: message,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };
  
  const addUserMessage = (message: string, questionId?: string) => {
    const newMessage = {
      id: Date.now().toString(),
      type: 'answer' as const,
      content: message,
      timestamp: Date.now(),
      questionId: questionId
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const askQuestion = (question: UnifiedQuestion) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let personalizedQuestion = question.question;
      
      // Personalize question with user's name if available
      if (userName && question.id !== 'full_name') {
        personalizedQuestion = personalizedQuestion.replace(/^(Hi|Hello)/, `Hi ${userName}`);
      }
      
      addBotMessage(personalizedQuestion);
      
      // Add help text if available
      if (question.helpText) {
        setTimeout(() => {
          addBotMessage(`💡 ${question.helpText}`);
        }, 800);
      }
    }, 1500);
  };

  const handleAnswer = async (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    const newAnsweredQuestions = [...answeredQuestions, questionId];
    
    // Store username if it's the username question
    if (questionId === 'username') {
      setUserName(answer);
    }
    
    // Add user's answer to chat
    let displayAnswer = '';
    if (typeof answer === 'string') {
      displayAnswer = answer;
    } else if (Array.isArray(answer)) {
      displayAnswer = answer.join(', ');
    } else if (answer instanceof Date) {
      displayAnswer = answer.toLocaleDateString();
    }
    
    addUserMessage(displayAnswer, questionId);
    
    setAnsweredQuestions(newAnsweredQuestions);
    setAnswers(newAnswers);
    
    // Save to unified onboarding backend API
    try {
      const result = await unifiedOnboardingAPI.saveOnboardingResponse(
        questionId,
        answer,
        currentPhase
      );
      
      if (result && result.success) {
        console.log('✅ Answer saved to unified onboarding successfully');
        
        // Update progress with response data
        if (result.data?.completionPercentage) {
          setProgressValue(result.data.completionPercentage);
        }
      } else {
        console.log('❌ Failed to save answer to unified onboarding:', result?.message);
      }
    } catch (error) {
      console.log('❌ Error saving answer to unified onboarding:', error);
    }
    
    // Clear current inputs
    setCurrentAnswer('');
    setSelectedOptions([]);
    setSelectedImage('');
    setSelectedDate(new Date());
    setShowDropdown(false);
    setShowDatePicker(false);
    
    // Move to next question after a delay
    setTimeout(() => {
      const nextQuestion = getNextRecommendedQuestion(newAnsweredQuestions);
      
      if (nextQuestion) {
        askQuestion(nextQuestion);
      } else {
        // All questions completed
        setTimeout(() => {
          const completion = calculateUnifiedCompletion(newAnsweredQuestions);
          const totalQuestions = getTotalQuestions();
          
          const congratsMessage = userName 
            ? `🎉 Amazing work, ${userName}! You've completed ${newAnsweredQuestions.length} out of ${totalQuestions} questions!`
            : `🎉 Amazing work! You've completed ${newAnsweredQuestions.length} out of ${totalQuestions} questions!`;
          
          addBotMessage(congratsMessage);
          
          setTimeout(() => {
            handleOnboardingComplete();
          }, 2000);
        }, 1000);
      }
    }, 1000);
  };

  const handleOnboardingComplete = async () => {
    addBotMessage('✨ Thank you for sharing your information with me!');
    
    setTimeout(() => {
      addBotMessage('🔍 Now I\'ll start searching for your matches using our advanced AI...');
    }, 1800);
    
    setTimeout(async () => {
      try {
        // Mark onboarding as complete
        const result = await unifiedOnboardingAPI.completeOnboarding('completed');
        
        if (result && result.success) {
          addBotMessage('✅ Your profile is complete and ready for amazing connections!');
          
          // Update user data in auth store
          const { setUser, syncProfileFromBackend } = useAuthStore.getState();
          const updatedUser = {
            ...user,
            ...result.data?.user,
            profile_completed: true,
            profile_complete: true
          };
          setUser(updatedUser);
          
          // Sync from backend
          setTimeout(() => {
            syncProfileFromBackend();
          }, 1000);
          
          // Update AuthStorage
          AuthStorage.updateUserData({ 
            profile_completed: true,
            profile_complete: true 
          });
          
          setTimeout(() => {
            addBotMessage('🌟 Taking you to your completion screen...');
            setTimeout(() => {
              // Navigate to OnboardingCompletion screen
              navigation.navigate('OnboardingCompletion', {
                completionPercentage: result.data?.completionPercentage || 85
              });
            }, 1500);
          }, 2000);
        } else {
          console.log('Failed to mark unified onboarding as complete:', result?.message);
          // Still proceed to main app
          showMainApp();
        }
      } catch (error) {
        console.log('Error completing unified onboarding:', error);
        showMainApp();
      }
    }, 3600);
  };

  const showMainApp = () => {
    const { setUser } = useAuthStore.getState();
    const updatedUser = {
      ...user,
      profile_completed: true,
      profile_complete: true
    };
    setUser(updatedUser);
    
    AuthStorage.updateUserData({ 
      profile_completed: true,
      profile_complete: true 
    });
    
    // Navigate to completion screen instead of directly to main app
    navigation.navigate('OnboardingCompletion', {
      completionPercentage: 75 // Default fallback percentage
    });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getCurrentQuestion = (): UnifiedQuestion | null => {
    return getNextRecommendedQuestion(answeredQuestions);
  };

  const currentQuestion = getCurrentQuestion();

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    
    let finalAnswer: any;
    let isValid = false;
    
    switch (currentQuestion.type) {
      case 'select':
        finalAnswer = selectedOptions[0];
        isValid = selectedOptions.length > 0;
        break;
      case 'date':
        finalAnswer = selectedDate.toISOString().split('T')[0];
        isValid = true;
        break;
      default:
        finalAnswer = currentAnswer.trim();
        isValid = currentQuestion.required ? !!finalAnswer : true;
        break;
    }
    
    if (!isValid) {
      Alert.alert('Please provide an answer before continuing');
      return;
    }
    
    handleAnswer(currentQuestion.id, finalAnswer);
  };

  const handleOptionSelect = (option: string) => {
    if (currentQuestion?.type === 'select') {
      setSelectedOptions([option]);
    }
  };


  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
      if (currentQuestion) {
        const dateString = selectedDate.toISOString().split('T')[0];
        handleAnswer(currentQuestion.id, dateString);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#fcd3aa" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.aiAvatarHeader}>
              <Text style={styles.logoText}>Yo!</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Unified Onboarding</Text>
              <Text style={styles.headerStatus}>Online • {Math.round(progressValue)}% complete</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressValue}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progressValue)}% Complete</Text>
        </View>

        {/* Chat Messages Area */}
        <View style={styles.messagesContainer}>
          <View style={styles.dottedBackground}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
              <Defs>
                <Pattern
                  id="whiteDots"
                  patternUnits="userSpaceOnUse"
                  width="20"
                  height="20"
                >
                  <Circle
                    cx="10"
                    cy="10"
                    r="1"
                    fill="rgba(255, 255, 255, 0.1)"
                  />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#whiteDots)" />
            </Svg>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToBottom}
            scrollEventThrottle={16}
          >
            {/* Chat Messages */}
            {chatMessages.map((message, index) => (
              <View key={message.id} style={[
                styles.messageContainer, 
                message.type === 'answer' ? styles.userMessageContainer : styles.botMessageContainer
              ]}>
                {message.type === 'question' && (
                  <View style={styles.aiAvatar}>
                    <Text style={styles.logoTextSmall}>Yo!</Text>
                  </View>
                )}
                
                <View style={[
                  styles.messageBubble,
                  message.type === 'answer' ? styles.userMessage : styles.aiMessage
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.type === 'answer' ? styles.userMessageText : styles.aiMessageText
                  ]}>
                    {message.content}
                  </Text>
                  
                  <Text style={[
                    styles.messageTime,
                    message.type === 'answer' ? styles.userMessageTime : styles.aiMessageTime
                  ]}>
                    {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: false 
                    })}
                  </Text>
                </View>
                
                {message.type === 'answer' && (
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <View style={styles.messageContainer}>
                <View style={styles.aiAvatar}>
                  <Text style={styles.logoTextSmall}>Yo!</Text>
                </View>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, styles.dot1]} />
                    <View style={[styles.typingDot, styles.dot2]} />
                    <View style={[styles.typingDot, styles.dot3]} />
                  </View>
                </View>
              </View>
            )}
            
            {/* Question Options */}
            {currentQuestion?.type === 'select' && currentQuestion.options && (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    selectedOptions.length > 0 && styles.dropdownButtonTextSelected
                  ]}>
                    {selectedOptions.length > 0 ? selectedOptions[0] : "Tap to select an option"}
                  </Text>
                  <Ionicons 
                    name={showDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#0091ad" 
                  />
                </TouchableOpacity>
                
                {showDropdown && (
                  <View style={styles.dropdownMenu}>
                    {currentQuestion.options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropdownOption,
                          selectedOptions.includes(option) && styles.selectedDropdownOption,
                          index === currentQuestion.options!.length - 1 && styles.lastDropdownOption
                        ]}
                        onPress={() => {
                          handleOptionSelect(option);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          selectedOptions.includes(option) && styles.selectedDropdownOptionText
                        ]}>
                          {option}
                        </Text>
                        {selectedOptions.includes(option) && (
                          <Ionicons name="checkmark" size={18} color="#0091ad" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}


            {/* Date Picker */}
            {currentQuestion?.type === 'date' && (
              <View style={styles.datePickerContainer}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#0091ad" />
                  <Text style={styles.datePickerText}>
                    {selectedDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#0091ad" />
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date(1930, 0, 1)}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            )}
            
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputArea}>
          {currentQuestion && (currentQuestion.type === 'text' || currentQuestion.type === 'multiline') ? (
            <View style={styles.textInputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.textInput,
                    currentQuestion?.type === 'multiline' && styles.multilineInput
                  ]}
                  value={currentAnswer}
                  onChangeText={setCurrentAnswer}
                  placeholder={currentQuestion?.placeholder || "Type your answer..."}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline={currentQuestion?.type === 'multiline'}
                  onFocus={scrollToBottom}
                  selectionColor="#fcd3aa"
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButtonInline,
                    (!currentAnswer.trim() && currentQuestion?.required) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSubmitAnswer}
                  disabled={!currentAnswer.trim() && currentQuestion?.required}
                >
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color={(!currentAnswer.trim() && currentQuestion?.required) ? '#666666' : '#0091ad'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : currentQuestion ? (
            <TouchableOpacity 
              style={[
                styles.continueButton,
                (currentQuestion.type === 'select' && selectedOptions.length === 0) && styles.continueButtonDisabled
              ]}
              onPress={handleSubmitAnswer}
              disabled={currentQuestion.type === 'select' && selectedOptions.length === 0}
            >
              <Text style={[
                styles.continueButtonText,
                (currentQuestion.type === 'select' && selectedOptions.length === 0) && styles.continueButtonTextDisabled
              ]}>
                Continue
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={18} 
                color={(currentQuestion.type === 'select' && selectedOptions.length === 0) ? '#666666' : '#ffffff'} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => {
                const nextQuestion = getNextRecommendedQuestion(answeredQuestions);
                if (nextQuestion) {
                  askQuestion(nextQuestion);
                } else {
                  handleOnboardingComplete();
                }
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="chevron-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  aiAvatarHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(252,211,170,0.7)',
    marginTop: 1,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0091ad',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fcd3aa',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dottedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  botMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  aiMessage: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userMessage: {
    backgroundColor: 'transparent',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  aiMessageText: {
    color: '#ffffff',
  },
  userMessageText: {
    color: '#ffffff',
  },
  
  messageTime: {
    fontSize: 11,
    textAlign: 'right',
  },
  aiMessageTime: {
    color: 'rgba(252,211,170,0.6)',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Typing
  typingIndicator: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 2,
  },
  dot1: {},
  dot2: {},
  dot3: {},
  
  // Input
  inputArea: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(252,211,170,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(252,211,170,0.08)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    maxHeight: 120,
    minHeight: 20,
    paddingVertical: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  sendButtonInline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButton: {
    backgroundColor: '#0091ad',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  
  bottomSpacing: {
    height: 60,
  },
  
  // Dropdown
  dropdownContainer: {
    marginTop: 16,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: 'rgba(252,211,170,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(252,211,170,0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26,26,26,0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1001,
  },
  dropdownOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  selectedDropdownOption: {
    backgroundColor: 'rgba(0,145,173,0.1)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  selectedDropdownOptionText: {
    fontWeight: '500',
    color: '#0091ad',
  },
  
  // Date Picker
  datePickerContainer: {
    marginTop: 16,
  },
  datePickerButton: {
    backgroundColor: 'rgba(0,145,173,0.15)',
    borderWidth: 2,
    borderColor: '#0091ad',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
  },
});

export default UnifiedOnboardingScreen;