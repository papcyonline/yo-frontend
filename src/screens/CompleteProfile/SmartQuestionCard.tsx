// Smart Question Card Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SmartQuestion } from './smartQuestionFlow';

const { width } = Dimensions.get('window');

interface SmartQuestionCardProps {
  question: SmartQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, answer: any, points: number) => void;
  currentAnswer?: any;
}

const SmartQuestionCard: React.FC<SmartQuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  currentAnswer
}) => {
  const [answer, setAnswer] = useState<any>(currentAnswer || '');
  const [selectedCards, setSelectedCards] = useState<string[]>(currentAnswer || []);
  const [animationValue] = useState(new Animated.Value(0));
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Animate in the question
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (currentAnswer) {
      if (question.type === 'card-select') {
        setSelectedCards(Array.isArray(currentAnswer) ? currentAnswer : [currentAnswer]);
      } else {
        setAnswer(currentAnswer);
      }
    }
  }, [currentAnswer, question.type]);

  const handleTextAnswer = (text: string) => {
    setAnswer(text);
    setTyping(true);
    
    // Debounce for auto-save
    setTimeout(() => {
      setTyping(false);
    }, 1000);
  };

  const handleCardSelect = (cardId: string) => {
    let newSelection: string[];
    
    if (selectedCards.includes(cardId)) {
      newSelection = selectedCards.filter(id => id !== cardId);
    } else {
      newSelection = [...selectedCards, cardId];
    }
    
    setSelectedCards(newSelection);
  };

  const handleSubmit = () => {
    let finalAnswer: any;
    
    switch (question.type) {
      case 'card-select':
        finalAnswer = selectedCards;
        if (selectedCards.length === 0) {
          Alert.alert('Please select at least one option');
          return;
        }
        break;
      case 'select':
        finalAnswer = answer;
        if (!answer) {
          Alert.alert('Please select an option');
          return;
        }
        break;
      default:
        finalAnswer = answer.trim();
        if (question.required && !finalAnswer) {
          Alert.alert('This question is required');
          return;
        }
        break;
    }
    
    onAnswer(question.id, finalAnswer, question.points);
  };

  const renderTextInput = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[
          styles.textInput,
          question.type === 'multiline' || question.type === 'story' ? styles.multilineInput : {}
        ]}
        value={answer}
        onChangeText={handleTextAnswer}
        placeholder={question.placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        multiline={question.type === 'multiline' || question.type === 'story'}
        numberOfLines={question.type === 'story' ? 6 : question.type === 'multiline' ? 4 : 1}
        textAlignVertical={question.type === 'multiline' || question.type === 'story' ? 'top' : 'center'}
        selectionColor="#fcd3aa"
      />
      
      {typing && (
        <View style={styles.typingIndicator}>
          <Animated.View 
            style={[
              styles.typingDot,
              {
                opacity: animationValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
              }
            ]}
          />
          <Text style={styles.typingText}>Looking good!</Text>
        </View>
      )}
    </View>
  );

  const renderSelectInput = () => (
    <View style={styles.selectContainer}>
      {question.options?.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.selectOption,
            answer === option && styles.selectedOption
          ]}
          onPress={() => setAnswer(option)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.selectOptionIcon,
            answer === option && styles.selectedOptionIcon
          ]}>
            {answer === option && (
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            )}
          </View>
          <Text style={[
            styles.selectOptionText,
            answer === option && styles.selectedOptionText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCardSelect = () => (
    <View style={styles.cardContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardScrollContent}
      >
        {question.cards?.map((card, index) => {
          const isSelected = selectedCards.includes(card.id);
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                isSelected && styles.selectedCard
              ]}
              onPress={() => handleCardSelect(card.id)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.cardContent,
                  {
                    transform: [{
                      scale: animationValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    }],
                  }
                ]}
              >
                <View style={[
                  styles.cardIcon,
                  isSelected && styles.selectedCardIcon
                ]}>
                  <Ionicons 
                    name={card.icon as any} 
                    size={22} 
                    color={isSelected ? '#ffffff' : '#0091ad'} 
                  />
                </View>
                <Text style={[
                  styles.cardLabel,
                  isSelected && styles.selectedCardLabel
                ]}>
                  {card.label}
                </Text>
                {isSelected && (
                  <View style={styles.cardCheckmark}>
                    <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {selectedCards.length > 0 && (
        <View style={styles.selectedSummary}>
          <Text style={styles.selectedSummaryText}>
            {selectedCards.length} option{selectedCards.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );

  const getInputComponent = () => {
    switch (question.type) {
      case 'card-select':
        return renderCardSelect();
      case 'select':
        return renderSelectInput();
      default:
        return renderTextInput();
    }
  };

  const canSubmit = () => {
    switch (question.type) {
      case 'card-select':
        return selectedCards.length > 0;
      case 'select':
        return !!answer;
      default:
        return question.required ? !!answer.trim() : true;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        }
      ]}
    >
      {/* Clean Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(questionNumber / totalQuestions) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Clean Question Card */}
      <View style={styles.questionCard}>
        {/* Points Badge */}
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={16} color="#fcd3aa" />
          <Text style={styles.pointsText}>+{question.points} points</Text>
        </View>

        {/* Question Text */}
        <Text style={styles.questionText}>{question.question}</Text>
        
        {/* Input Component */}
        <View style={styles.inputSection}>
          {getInputComponent()}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit() && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit()}
        >
          <Text style={[
            styles.submitButtonText,
            !canSubmit() && styles.submitButtonTextDisabled
          ]}>
            {questionNumber === totalQuestions ? 'Complete Phase' : 'Continue'}
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={canSubmit() ? '#ffffff' : '#666666'} 
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
  },
  
  // Clean Progress Design
  progressContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
    marginBottom: 12,
  },
  progressBar: {
    width: '60%',
    height: 4,
    backgroundColor: 'rgba(252,211,170,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fcd3aa',
    borderRadius: 2,
  },
  
  // Clean Question Card
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  
  // Clean Points Badge
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,211,170,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    alignSelf: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fcd3aa',
    marginLeft: 6,
  },
  
  // Clean Question Text
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 30,
    marginBottom: 32,
    textAlign: 'center',
  },
  
  // Input Section
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 0,
  },
  
  // Clean Text Input
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    minHeight: 60,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0091ad',
    marginRight: 8,
  },
  typingText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(0,145,173,0.8)',
  },
  
  // Clean Select Options
  selectContainer: {
    gap: 12,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(0,145,173,0.15)',
    borderColor: '#0091ad',
  },
  selectOptionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(252,211,170,0.4)',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOptionIcon: {
    backgroundColor: '#0091ad',
    borderColor: '#0091ad',
  },
  selectOptionText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // Clean Card Selection
  cardContainer: {
    alignItems: 'center',
  },
  cardScrollContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: 110,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedCard: {
    transform: [{ scale: 1.05 }],
  },
  cardContent: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    position: 'relative',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,145,173,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCardIcon: {
    backgroundColor: '#0091ad',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  selectedCardLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cardCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  selectedSummary: {
    marginTop: 16,
    alignItems: 'center',
  },
  selectedSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0091ad',
  },
  
  // Clean Submit Button
  submitButton: {
    backgroundColor: '#0091ad',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  submitButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});

export default SmartQuestionCard;