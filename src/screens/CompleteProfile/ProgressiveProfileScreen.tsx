// Progressive Profile Completion Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

import { 
  questionPhases, 
  SmartQuestion, 
  getCurrentPhase, 
  getNextPhase, 
  getCompletionPercentage,
} from './smartQuestionFlow';
import { progressiveProfileAPI } from '../../services/api/progressive';
import SmartQuestionCard from './SmartQuestionCard';
import ProgressTracker from './ProgressTracker';
import { useAuthStore } from '../../store/authStore';
import { AuthStorage } from '../../utils/AuthStorage';
import { API_CONFIG } from '../../constants/api';

const { width } = Dimensions.get('window');

interface ProgressiveProfileProps {
  navigation: any;
  route: any;
}

const ProgressiveProfileScreen: React.FC<ProgressiveProfileProps> = ({ navigation, route }) => {
  const { user, mode = 'form' } = route.params || {};
  
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showReward, setShowReward] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  
  // Animation values
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));
  const [rewardAnim] = useState(new Animated.Value(0));
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'question' | 'answer', content: string, timestamp: number, questionId?: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Resume functionality state
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [resumeFromQuestion, setResumeFromQuestion] = useState(0);
  const [resumeFromPhase, setResumeFromPhase] = useState('essential');

  useEffect(() => {
    // Load any existing progress
    loadProgress();
    
    // Start the conversation
    startConversation();
  }, []);

  useEffect(() => {
    // Update progress based on answered questions
    const totalQuestions = questionPhases.reduce((total, phase) => total + phase.questions.length, 0);
    const progress = totalQuestions > 0 ? (answeredQuestions.length / totalQuestions) * 100 : 0;
    setProgressValue(progress);
  }, [answeredQuestions]);
  
  const determineResumePoint = (savedQuestions: string[], savedAnswers: Record<string, any>) => {
    if (savedQuestions.length === 0) {
      return {
        hasProgress: false,
        questionIndex: 0,
        phase: 'essential'
      };
    }

    // Find which phase we should be in based on answered questions
    const essentialQuestions = questionPhases[0].questions;
    const coreQuestions = questionPhases[1].questions;
    const richQuestions = questionPhases[2].questions;

    // Smart resume: Find the first unanswered question in essential phase
    const firstUnansweredEssential = essentialQuestions.findIndex(q => !savedQuestions.includes(q.id));
    if (firstUnansweredEssential !== -1) {
      return {
        hasProgress: savedQuestions.length > 0,
        questionIndex: firstUnansweredEssential,
        phase: 'essential'
      };
    }

    // If all essential are answered, check core phase
    const firstUnansweredCore = coreQuestions.findIndex(q => !savedQuestions.includes(q.id));
    if (firstUnansweredCore !== -1) {
      return {
        hasProgress: true,
        questionIndex: firstUnansweredCore,
        phase: 'core'
      };
    }

    // If all essential and core are answered, check rich phase
    const firstUnansweredRich = richQuestions.findIndex(q => !savedQuestions.includes(q.id));
    if (firstUnansweredRich !== -1) {
      return {
        hasProgress: true,
        questionIndex: firstUnansweredRich,
        phase: 'rich'
      };
    }

    // All questions completed
    return {
      hasProgress: true,
      questionIndex: 0,
      phase: 'completed'
    };
  };

  const startConversation = () => {
    setTimeout(() => {
      if (hasExistingProgress && userName) {
        // Resume conversation
        const answeredCount = answeredQuestions.length;
        addBotMessage(`👋 Welcome back, ${userName}! I see you've already answered ${answeredCount} questions. Let me continue with the remaining questions to complete your profile.`);
        setTimeout(() => {
          if (resumeFromPhase === 'completed') {
            handleProfileCompletion();
          } else {
            resumeFromWhereLeftOff();
          }
        }, 2000);
      } else if (hasExistingProgress) {
        // Have progress but no username yet
        addBotMessage('👋 Welcome back! Let me continue with your profile registration where we left off.');
        setTimeout(() => {
          resumeFromWhereLeftOff();
        }, 2000);
      } else {
        // First time - single greeting message and start with first question
        addBotMessage('👋 Hi there! I\'m here to help you complete your profile registration. Let\'s start with some basic information so I can connect you with the right people!');
        setTimeout(() => {
          // Get the first question from essential phase
          const firstQuestion = questionPhases[0].questions[0];
          if (firstQuestion) {
            askQuestion(firstQuestion);
          }
        }, 2000);
      }
    }, 1000);
  };

  const resumeFromWhereLeftOff = () => {
    // Set the correct question index based on where we left off
    setCurrentQuestionIndex(resumeFromQuestion);
    
    // Get all questions from all phases
    const allQuestions = getAllQuestions();
    const nextQuestion = allQuestions.find(q => !answeredQuestions.includes(q.id));
    
    if (nextQuestion && !answeredQuestions.includes(nextQuestion.id)) {
      // Only ask if this question hasn't been answered
      setTimeout(() => {
        if (userName && nextQuestion.id !== 'username') {
          const personalizedQuestion = nextQuestion.question.replace(/^(Yo!|Hi there!)/, `Yo! ${userName}`);
          const personalizedNextQuestion = { ...nextQuestion, question: personalizedQuestion };
          askQuestion(personalizedNextQuestion);
        } else {
          askQuestion(nextQuestion);
        }
      }, 1000);
    } else {
      // All questions completed
      setTimeout(() => {
        handleProfileCompletion();
      }, 1000);
    }
  };

  const handleProfileCompletion = async () => {
    // Congratulations message
    const finalMessage = userName ? `🎉 Congratulations ${userName}! You've completed your profile!` : '🎉 Congratulations! You\'ve completed your profile!';
    addBotMessage(finalMessage);
    
    setTimeout(() => {
      addBotMessage('✨ Thank you for sharing your beautiful stories with me!');
    }, 1800);
    
    setTimeout(() => {
      addBotMessage('🪑 Now sit back and relax while I search for your matches...');
    }, 3600);
    
    setTimeout(() => {
      addBotMessage('🔍 Analyzing your family stories and background...');
    }, 5400);
    
    setTimeout(() => {
      addBotMessage('🔗 Looking for people with similar heritage and connections...');
    }, 7200);
    
    setTimeout(() => {
      addBotMessage('🎯 Finding your potential family and community matches...');
      
      // Auto-sync all profile data to main user profile
      setTimeout(async () => {
        try {
          // Call finalize API to sync all data to main profile
          const finalizeResponse = await progressiveProfileAPI.finalizeProfile();
          
          if (finalizeResponse.success) {
            addBotMessage('✅ Perfect! Your matches are ready!');
            setTimeout(() => {
              addBotMessage('🌟 Welcome to your new connections! Let\'s explore them together...');
              setTimeout(() => {
                showSuccessScreen(finalizeResponse.data?.user || user);
              }, 2000);
            }, 1500);
          } else {
            console.log('Profile finalization API returned error:', finalizeResponse.error);
            // Still proceed as profile completion was successful locally
            addBotMessage('✅ Your profile is complete and matches are ready!');
            setTimeout(() => {
              addBotMessage('🌟 Welcome to your new journey of connections!');
              setTimeout(() => {
                // Mark as completed locally even if API failed
                const fallbackUser = {
                  ...user,
                  profile_completed: true,
                  profile_complete: true
                };
                showSuccessScreen(fallbackUser);
              }, 2000);
            }, 1500);
          }
        } catch (error) {
          console.log('Profile finalization error:', error);
          // Don't let API failures prevent profile completion
          addBotMessage('✅ Your profile is complete!');
          setTimeout(() => {
            addBotMessage('🌟 Ready to discover your connections? Let\'s go!');
            setTimeout(() => {
              // Mark as completed locally even if API failed
              const fallbackUser = {
                ...user,
                profile_completed: true,
                profile_complete: true
              };
              showSuccessScreen(fallbackUser);
            }, 2000);
          }, 1500);
        }
      }, 1200);
    }, 9000);
  };

  const showSuccessScreen = (userData: any) => {
    // Clear chat and show success animation
    setChatMessages([]);
    setIsTyping(false);
    
    // Update user data in auth store with completed profile status and sync from backend
    const { setUser, syncProfileFromBackend } = useAuthStore.getState();
    const updatedUser = {
      ...userData,
      profile_completed: true,
      profile_complete: true
    };
    setUser(updatedUser);
    
    // Sync the latest profile data from backend to ensure all components have fresh data
    setTimeout(() => {
      syncProfileFromBackend();
    }, 1000);
    
    // Also update AuthStorage for persistence
    AuthStorage.updateUserData({ 
      profile_completed: true,
      profile_complete: true 
    });
    
    // Show success message with checkmark
    setTimeout(() => {
      addBotMessage('🎉 Success! Your profile is now complete and ready for amazing connections!');
      
      // Show loading and navigate after success screen
      setTimeout(() => {
        addBotMessage('Taking you to your dashboard...');
        setTimeout(() => {
          // Navigate to MainApp (Dashboard) with correct route name
          navigation.reset({
            index: 0,
            routes: [{
              name: 'MainApp',
              params: { 
                profileComplete: true, 
                user: updatedUser 
              }
            }]
          });
        }, 1500);
      }, 2000);
    }, 500);
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
  

  const askQuestion = (question: SmartQuestion) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(question.question);
    }, 1500);
  };

  const loadProgress = async () => {
    try {
      // Load progressive profile status from backend
      const statusResponse = await progressiveProfileAPI.getProgressiveStatus();
      
      if (statusResponse.success && statusResponse.data) {
        const { profile } = statusResponse.data;
        const savedAnswers = profile.answers || {};
        const savedQuestions = profile.answered_questions || [];
        
        setAnswers(savedAnswers);
        setAnsweredQuestions(savedQuestions);
        
        // If there's a username in the answers, set it
        if (savedAnswers?.username) {
          setUserName(savedAnswers.username);
        }

        // Determine where to resume from
        const resumeInfo = determineResumePoint(savedQuestions, savedAnswers);
        setResumeFromQuestion(resumeInfo.questionIndex);
        setResumeFromPhase(resumeInfo.phase);
        setHasExistingProgress(resumeInfo.hasProgress);
        
        console.log('Resume info:', resumeInfo);
      }
      
      // Also load saved answers from MongoDB endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/progressive/answers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const answersData = await response.json();
      if (response.ok && answersData.success && answersData.data) {
        const fallbackAnswers = answersData.data.answers || {};
        const fallbackQuestions = Object.keys(fallbackAnswers);
        
        // Only use fallback if we don't have data from statusResponse
        if (Object.keys(answers).length === 0) {
          setAnswers(fallbackAnswers);
          setAnsweredQuestions(fallbackQuestions);
          
          if (fallbackAnswers?.username) {
            setUserName(fallbackAnswers.username);
          }

          const resumeInfo = determineResumePoint(fallbackQuestions, fallbackAnswers);
          setResumeFromQuestion(resumeInfo.questionIndex);
          setResumeFromPhase(resumeInfo.phase);
          setHasExistingProgress(resumeInfo.hasProgress);
        }
      }
    } catch (error) {
      console.log('Failed to load progress:', error);
      // Continue with default values if loading fails
    }
  };

  const saveProgress = async (newAnswers: Record<string, any>) => {
    try {
      // Update local state immediately for responsiveness
      setAnswers(newAnswers);
    } catch (error) {
      console.log('Failed to save progress:', error);
      // Continue with local state even if backend save fails
    }
  };

  const showRewardAnimation = () => {
    setShowReward(true);
    Animated.sequence([
      Animated.timing(rewardAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(rewardAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => setShowReward(false));
  };

  // Get current question from all phases - recalculate each time
  const getAllQuestions = () => {
    const allQuestions = [
      ...questionPhases[0].questions,
      ...questionPhases[1].questions, 
      ...questionPhases[2].questions
    ];
    
    // Filter out questions that ask for information already collected during registration
    // These questions should not be repeated in the AI questionnaire
    const registrationQuestions = ['full_name', 'username', 'date_of_birth', 'current_location', 'gender', 'email', 'phone'];
    
    return allQuestions.filter(question => !registrationQuestions.includes(question.id));
  };
  
  const getCurrentQuestion = () => {
    const allQuestions = getAllQuestions();
    return allQuestions.find(q => !answeredQuestions.includes(q.id)) || null;
  };
  
  const currentQuestion = getCurrentQuestion();

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
    }
    
    addUserMessage(displayAnswer, questionId);
    
    setAnsweredQuestions(newAnsweredQuestions);
    
    // Save to MongoDB backend API
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/chatflow/save-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          answer,
          points: 5
        }),
      });
      
      const saveResponse = await response.json();
      
      if (response.ok && saveResponse.success) {
        console.log('✅ Answer saved to MongoDB successfully');
      } else {
        console.log('❌ Failed to save answer to MongoDB:', saveResponse.message);
      }
    } catch (error) {
      console.log('❌ Error saving answer to MongoDB backend:', error);
    }
    
    saveProgress(newAnswers);
    
    // Clear current inputs
    setCurrentAnswer('');
    setSelectedOptions([]);
    setSelectedImage('');
    setSelectedImages([]);
    setSelectedDate(new Date());
    setShowDropdown(false);
    setShowDatePicker(false);
    
    // Move to next question after a delay
    setTimeout(() => {
      // Get ALL questions from ALL phases in order
      const allQuestions = getAllQuestions();
      
      // Find the next unanswered question from all phases
      const nextUnansweredQuestion = allQuestions.find(q => !newAnsweredQuestions.includes(q.id));
      
      if (nextUnansweredQuestion) {
        // Ask the next unanswered question
        if (userName && questionId !== 'username') {
          const personalizedQuestion = nextUnansweredQuestion.question.replace(/^(Yo!|Hi there!)/, `Yo! ${userName}`);
          const personalizedNextQuestion = { ...nextUnansweredQuestion, question: personalizedQuestion };
          askQuestion(personalizedNextQuestion);
        } else {
          askQuestion(nextUnansweredQuestion);
        }
      } else {
        // All questions completed - make sure we really have answered all questions
        const totalQuestions = questionPhases.reduce((total, phase) => total + phase.questions.length, 0);
        
        if (newAnsweredQuestions.length >= totalQuestions) {
          // Truly all questions completed
          setTimeout(() => {
            const greeting = userName ? `Amazing work, ${userName}! You've completed all ${totalQuestions} questions! 🎉` : `Amazing work! You've completed all ${totalQuestions} questions! 🎉`;
            addBotMessage(greeting);
            setTimeout(() => {
              handleProfileCompletion();
            }, 2000);
          }, 1000);
        } else {
          // Find the next unanswered question - this shouldn't happen, but safety check
          const allQuestions = getAllQuestions();
          const nextUnansweredQuestion = allQuestions.find(q => !newAnsweredQuestions.includes(q.id));
          if (nextUnansweredQuestion) {
            console.log('Found missed question:', nextUnansweredQuestion.id);
            askQuestion(nextUnansweredQuestion);
          }
        }
      }
    }, 1000);
  };

  const handlePhaseComplete = async () => {
    // Since we're asking all questions sequentially, this function is simplified
    handleProfileCompletion();
  };

  const handleSkip = () => {
    const allQuestions = getAllQuestions();
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      Alert.alert(
        'Skip this section?',
        'You can always come back later to complete this.',
        [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Skip', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const getMotivationalMessage = () => {
    const percentage = progressValue;
    if (percentage < 25) return "Great start! Every detail helps us find your perfect matches.";
    if (percentage < 50) return "You're doing amazing! Your profile is getting stronger.";
    if (percentage < 75) return "Fantastic progress! You're almost to premium matching.";
    return "You're a profile superstar! Maximum matching power activated.";
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Auto-submit the image
        if (currentQuestion) {
          handleAnswer(currentQuestion.id, imageUri);
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your camera to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Auto-submit the image
        if (currentQuestion) {
          handleAnswer(currentQuestion.id, imageUri);
        }
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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

  const pickMultipleImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage = result.assets[0].uri;
        const maxImages = currentQuestion?.maxImages || 5;
        
        if (selectedImages.length < maxImages) {
          const updatedImages = [...selectedImages, newImage];
          setSelectedImages(updatedImages);
          
          // Auto-submit if we reach max images or user is done
          if (updatedImages.length >= maxImages) {
            if (currentQuestion) {
              handleAnswer(currentQuestion.id, updatedImages);
            }
          }
        } else {
          Alert.alert('Maximum reached', `You can only upload up to ${maxImages} images.`);
        }
      }
    } catch (error) {
      console.log('Error picking multiple images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    
    let finalAnswer: any;
    let isValid = false;
    
    switch (currentQuestion.type) {
      case 'card-select':
        finalAnswer = selectedOptions;
        isValid = selectedOptions.length > 0;
        break;
      case 'select':
        finalAnswer = selectedOptions[0];
        isValid = selectedOptions.length > 0;
        break;
      case 'image':
        finalAnswer = selectedImage;
        isValid = currentQuestion.required ? !!selectedImage : true;
        break;
      case 'multi-image':
        finalAnswer = selectedImages;
        isValid = currentQuestion.required ? selectedImages.length > 0 : true;
        break;
      case 'date-picker':
        finalAnswer = selectedDate.toISOString().split('T')[0];
        isValid = true; // Date picker always has a value
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
    } else if (currentQuestion?.type === 'card-select') {
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter(o => o !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    }
  };
  
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleEditMessage = (messageId: string) => {
    const message = chatMessages.find(m => m.id === messageId);
    if (message && message.type === 'answer') {
      setEditingMessage(messageId);
      setEditText(message.content);
      setShowOptionsMenu(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const messageToDelete = chatMessages.find(m => m.id === messageId);
    if (messageToDelete && messageToDelete.type === 'answer') {
      // Remove the user message and potentially go back to the corresponding question
      setChatMessages(prev => prev.filter(m => m.id !== messageId));
      
      // If we have a questionId, we could potentially allow re-answering
      if (messageToDelete.questionId) {
        // Remove the answer from the answers state
        const newAnswers = { ...answers };
        delete newAnswers[messageToDelete.questionId];
        setAnswers(newAnswers);
        
        // Remove from answered questions list
        setAnsweredQuestions(prev => prev.filter(id => id !== messageToDelete.questionId));
      }
      
      setShowOptionsMenu(false);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessage && editText.trim()) {
      setChatMessages(prev => prev.map(message => 
        message.id === editingMessage 
          ? { ...message, content: editText.trim() }
          : message
      ));
      
      // Update the answer in the answers state if we have questionId
      const editedMessage = chatMessages.find(m => m.id === editingMessage);
      if (editedMessage?.questionId) {
        setAnswers(prev => ({
          ...prev,
          [editedMessage.questionId!]: editText.trim()
        }));
      }
      
      setEditingMessage(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleMessageLongPress = (messageId: string) => {
    const message = chatMessages.find(m => m.id === messageId);
    if (message && message.type === 'answer') {
      setSelectedMessageId(messageId);
      setShowOptionsMenu(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Yo! Chat Header */}
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
              <Text style={styles.headerTitle}>Yo! Assistant</Text>
              <Text style={styles.headerStatus}>Online • {Math.round(progressValue)}% complete</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowOptionsMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#fcd3aa" />
          </TouchableOpacity>
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
          {/* White Dotted Background Pattern */}
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
            onScroll={() => setShowDropdown(false)}
            scrollEventThrottle={16}
          >
          {/* Render Chat History */}
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
              
              <TouchableOpacity
                style={[
                  styles.messageBubble,
                  message.type === 'answer' ? styles.userMessage : styles.aiMessage
                ]}
                onLongPress={() => message.type === 'answer' ? handleMessageLongPress(message.id) : undefined}
                activeOpacity={message.type === 'answer' ? 0.7 : 1}
              >
                {editingMessage === message.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      placeholder="Edit your message..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      selectionColor="#fcd3aa"
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.editButton} onPress={handleCancelEdit}>
                        <Text style={styles.editButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.editButton, styles.saveButton]} onPress={handleSaveEdit}>
                        <Text style={[styles.editButtonText, styles.saveButtonText]}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={[
                    styles.messageText,
                    message.type === 'answer' ? styles.userMessageText : styles.aiMessageText
                  ]}>
                    {message.content}
                  </Text>
                )}
                
                {editingMessage !== message.id && (
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
                )}
              </TouchableOpacity>
              
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
          
          {/* Dropdown for Select Questions */}
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


          {/* Image Upload */}
          {currentQuestion?.type === 'image' && (
            <View style={styles.imageContainer}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                      <Ionicons name="images" size={16} color="#ffffff" />
                      <Text style={styles.changeImageText}>Change Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.takePhotoButton} onPress={takePhoto}>
                      <Ionicons name="camera" size={16} color="#ffffff" />
                      <Text style={styles.takePhotoText}>Take New</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imageUploadOptions}>
                  <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
                    <Ionicons name="images" size={32} color="#0091ad" />
                    <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                    <Text style={styles.imageOptionDesc}>Pick a photo from your device</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
                    <Ionicons name="camera" size={32} color="#0091ad" />
                    <Text style={styles.imageOptionText}>Take a Photo</Text>
                    <Text style={styles.imageOptionDesc}>Use your camera to take a new photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.skipImageOption} 
                    onPress={() => currentQuestion && handleAnswer(currentQuestion.id, '')}
                  >
                    <Text style={styles.skipImageText}>Skip for now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Date Picker */}
          {currentQuestion?.type === 'date-picker' && (
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
                  minimumDate={currentQuestion.dateRange?.min ? new Date(currentQuestion.dateRange.min) : new Date(1930, 0, 1)}
                  maximumDate={currentQuestion.dateRange?.max ? new Date(currentQuestion.dateRange.max) : new Date()}
                />
              )}
            </View>
          )}

          {/* Multi-Image Upload */}
          {currentQuestion?.type === 'multi-image' && (
            <View style={styles.multiImageContainer}>
              {selectedImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedImagesContainer}>
                  {selectedImages.map((imageUri, index) => (
                    <View key={index} style={styles.selectedImageItem}>
                      <Image source={{ uri: imageUri }} style={styles.multiImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              <View style={styles.multiImageActions}>
                <TouchableOpacity style={styles.addImageButton} onPress={pickMultipleImages}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                  <Text style={styles.addImageText}>
                    Add Photo ({selectedImages.length}/{currentQuestion.maxImages || 5})
                  </Text>
                </TouchableOpacity>
                
                {selectedImages.length > 0 && (
                  <TouchableOpacity 
                    style={styles.doneWithImagesButton}
                    onPress={() => currentQuestion && handleAnswer(currentQuestion.id, selectedImages)}
                  >
                    <Text style={styles.doneWithImagesText}>Done</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.skipImagesButton}
                  onPress={() => currentQuestion && handleAnswer(currentQuestion.id, [])}
                >
                  <Text style={styles.skipImagesText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {currentQuestion?.type === 'card-select' && currentQuestion.cards && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
            >
              {currentQuestion.cards.map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardOption,
                    selectedOptions.includes(card.id) && styles.selectedCard
                  ]}
                  onPress={() => handleOptionSelect(card.id)}
                >
                  <Ionicons 
                    name={card.icon as any} 
                    size={24} 
                    color={selectedOptions.includes(card.id) ? '#ffffff' : '#0091ad'} 
                  />
                  <Text style={[
                    styles.cardLabel,
                    selectedOptions.includes(card.id) && styles.selectedCardLabel
                  ]}>
                    {card.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>

        {/* Fixed Input Area */}
        <View style={styles.inputArea}>
          {currentQuestion && (currentQuestion.type === 'text' || currentQuestion.type === 'story' || currentQuestion.type === 'multiline') ? (
            <View style={styles.textInputContainer}>
              <View style={styles.inputWrapper}>
                <TouchableOpacity 
                  style={styles.attachButton}
                  onPress={pickImage}
                >
                  <Ionicons name="add" size={20} color="#0091ad" />
                </TouchableOpacity>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.textInput,
                    (currentQuestion?.type === 'story' || currentQuestion?.type === 'multiline') && styles.multilineInput
                  ]}
                  value={currentAnswer}
                  onChangeText={setCurrentAnswer}
                  placeholder={currentQuestion?.placeholder || "Type your answer..."}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline={currentQuestion?.type === 'story' || currentQuestion?.type === 'multiline'}
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
          ) : currentQuestion && currentQuestion.type === 'select' ? (
            <TouchableOpacity 
              style={[
                styles.continueButton,
                (selectedOptions.length === 0) && styles.continueButtonDisabled
              ]}
              onPress={() => {
                setShowDropdown(false);
                handleSubmitAnswer();
              }}
              disabled={selectedOptions.length === 0}
            >
              <Text style={[
                styles.continueButtonText,
                (selectedOptions.length === 0) && styles.continueButtonTextDisabled
              ]}>
                Continue
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={18} 
                color={(selectedOptions.length === 0) ? '#666666' : '#ffffff'} 
              />
            </TouchableOpacity>
          ) : currentQuestion && currentQuestion.type === 'card-select' ? (
            <TouchableOpacity 
              style={[
                styles.continueButton,
                (selectedOptions.length === 0) && styles.continueButtonDisabled
              ]}
              onPress={handleSubmitAnswer}
              disabled={selectedOptions.length === 0}
            >
              <Text style={[
                styles.continueButtonText,
                (selectedOptions.length === 0) && styles.continueButtonTextDisabled
              ]}>
                Continue
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={18} 
                color={(selectedOptions.length === 0) ? '#666666' : '#ffffff'} 
              />
            </TouchableOpacity>
          ) : currentQuestion && currentQuestion.type === 'image' ? (
            <View style={styles.imageInstructions}>
              <Text style={styles.imageInstructionText}>
                {selectedImage ? '📸 Photo selected! It will be saved to your profile.' : '👆 Choose an option above to add your profile photo'}
              </Text>
            </View>
          ) : currentQuestion && currentQuestion.type === 'date-picker' ? (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleSubmitAnswer}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="chevron-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          ) : currentQuestion && currentQuestion.type === 'multi-image' ? (
            <View style={styles.imageInstructions}>
              <Text style={styles.imageInstructionText}>
                {selectedImages.length > 0 
                  ? `📸 ${selectedImages.length} photo(s) selected. Add more or tap Done when finished.` 
                  : '👆 Add family photos to help people recognize your relatives'}
              </Text>
            </View>
          ) : (
            // Fallback: Show a continue button when no current question (prevents UI break)
            <TouchableOpacity 
              style={[styles.continueButton]}
              onPress={() => {
                // Find next unanswered question from all phases
                const allQuestions = getAllQuestions();
                const nextQuestion = allQuestions.find(q => !answeredQuestions.includes(q.id));
                
                if (nextQuestion) {
                  setSelectedOptions([]);
                  setCurrentAnswer('');
                  
                  setTimeout(() => {
                    if (userName && nextQuestion.id !== 'username') {
                      const personalizedQuestion = nextQuestion.question.replace(/^(Yo!|Hi there!)/, `Yo! ${userName}`);
                      const personalizedNextQuestion = { ...nextQuestion, question: personalizedQuestion };
                      askQuestion(personalizedNextQuestion);
                    } else {
                      askQuestion(nextQuestion);
                    }
                  }, 100);
                } else {
                  handleProfileCompletion();
                }
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="chevron-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={() => selectedMessageId && handleEditMessage(selectedMessageId)}
            >
              <Ionicons name="pencil" size={20} color="#fcd3aa" />
              <Text style={styles.menuOptionText}>Edit Response</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={[styles.menuOption, styles.deleteOption]}
              onPress={() => {
                if (selectedMessageId) {
                  Alert.alert(
                    'Delete Response',
                    'Are you sure you want to delete this response? You can answer the question again.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: () => handleDeleteMessage(selectedMessageId)
                      }
                    ]
                  );
                }
              }}
            >
              <Ionicons name="trash" size={20} color="#ff6b6b" />
              <Text style={[styles.menuOptionText, styles.deleteOptionText]}>Delete Response</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reward Animation */}
      {showReward && (
        <Animated.View 
          style={[
            styles.rewardOverlay,
            {
              opacity: rewardAnim,
              transform: [{
                scale: rewardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
            }
          ]}
        >
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#fcd3aa']}
            style={styles.rewardCard}
          >
            <Ionicons name="trophy" size={48} color="#ffffff" />
            <Text style={styles.rewardTitle}>Level Up!</Text>
            <Text style={styles.rewardText}>You've unlocked new benefits!</Text>
          </LinearGradient>
        </Animated.View>
      )}
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
  
  // Yo! Chat Header
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
    fontWeight: '700',
    color: '#ffffff',
  },
  logoTextSmall: {
    fontSize: 10,
    fontWeight: '700',
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
    fontWeight: '400',
    color: 'rgba(252,211,170,0.7)',
    marginTop: 1,
  },
  moreButton: {
    padding: 8,
  },

  // Progress Bar
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
  
  // Messages Container
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
  
  // Message Containers
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
  
  // Avatars
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
    fontWeight: '700',
    color: '#ffffff',
  },
  
  // Message Bubbles
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
  
  // Message Text
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  aiMessageText: {
    fontWeight: '400',
    color: '#ffffff',
  },
  userMessageText: {
    fontWeight: '400',
    color: '#ffffff',
  },
  
  // Message Time
  messageTime: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'right',
  },
  aiMessageTime: {
    color: 'rgba(252,211,170,0.6)',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Typing Indicator
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
  dot1: {
    // Animation would be added here
  },
  dot2: {
    // Animation would be added here
  },
  dot3: {
    // Animation would be added here
  },
  
  // Options for Select Questions
  optionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  selectedOption: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    borderColor: '#0091ad',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // Cards for Card-Select Questions
  cardsContainer: {
    paddingHorizontal: 0,
    marginTop: 16,
    gap: 12,
  },
  cardOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    marginRight: 12,
  },
  selectedCard: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    borderColor: '#0091ad',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedCardLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Yo! Input Area
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
    fontWeight: '400',
    color: '#ffffff',
    maxHeight: 120,
    minHeight: 20,
    paddingVertical: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,145,173,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(252,211,170,0.3)',
    shadowOpacity: 0,
    elevation: 0,
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
  
  // Edit Message Styles
  editContainer: {
    width: '100%',
  },
  editInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minHeight: 40,
    maxHeight: 120,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    backgroundColor: '#0091ad',
    borderColor: '#0091ad',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  saveButtonText: {
    color: '#ffffff',
  },
  
  // Options Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: 'rgba(26,26,26,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
    minWidth: 200,
    paddingVertical: 8,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  deleteOption: {
    // No additional styles needed, color handled by text
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 12,
  },
  deleteOptionText: {
    color: '#ff6b6b',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  
  // Reward Animation
  rewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
  },
  rewardCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  rewardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  
  // Image Upload Styles
  imageContainer: {
    marginTop: 16,
  },
  imageUploadOptions: {
    gap: 12,
  },
  imageOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  imageOptionDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  skipImageOption: {
    padding: 12,
    alignItems: 'center',
  },
  skipImageText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
  },
  selectedImageContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changeImageButton: {
    backgroundColor: '#0091ad',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  takePhotoButton: {
    backgroundColor: 'rgba(252,211,170,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  takePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  imageInstructions: {
    padding: 16,
    alignItems: 'center',
  },
  imageInstructionText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
    textAlign: 'center',
  },
  
  // Dropdown Styles
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
    fontWeight: '400',
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
    fontWeight: '400',
    color: '#ffffff',
    flex: 1,
  },
  selectedDropdownOptionText: {
    fontWeight: '500',
    color: '#0091ad',
  },
  
  // Date Picker Styles
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
  
  // Multi-Image Styles
  multiImageContainer: {
    marginTop: 16,
  },
  selectedImagesContainer: {
    marginBottom: 16,
  },
  selectedImageItem: {
    position: 'relative',
    marginRight: 12,
  },
  multiImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
  },
  multiImageActions: {
    gap: 12,
  },
  addImageButton: {
    backgroundColor: '#0091ad',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  doneWithImagesButton: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    borderWidth: 1,
    borderColor: '#0091ad',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  doneWithImagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0091ad',
  },
  skipImagesButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipImagesText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
  },
});

export default ProgressiveProfileScreen;