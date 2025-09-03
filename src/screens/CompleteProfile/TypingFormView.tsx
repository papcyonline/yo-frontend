//TypingFormView.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect, Circle as SvgCircle } from 'react-native-svg';
import { questionGroups, QuestionGroup } from './personalDetailsQuestions';
import { API_CONFIG } from '../../constants/api';

interface TypingFormViewProps {
  handleSkip: () => void;
  handleSubmit: () => void;
  loading: boolean;
  userToken: string;
}

const TypingFormView: React.FC<TypingFormViewProps> = ({
  handleSkip,
  handleSubmit,
  loading,
  userToken
}) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [responses, setResponses] = useState<{[key: string]: any}>({});
  const [currentAnswers, setCurrentAnswers] = useState<{[key: string]: string}>({});

  const currentGroup = questionGroups[currentGroupIndex];
  const progress = ((currentGroupIndex + 1) / questionGroups.length) * 100;

  const handleAnswerChange = (field: string, value: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = async () => {
    // Save current group's answers
    const groupData = {
      ...responses[currentGroup.id],
      ...currentAnswers
    };

    setResponses(prev => ({
      ...prev,
      [currentGroup.id]: groupData
    }));

    // Submit to backend
    await submitGroupData(currentGroup, groupData);

    // Clear current answers for next group
    setCurrentAnswers({});

    if (currentGroupIndex < questionGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const submitGroupData = async (group: QuestionGroup, data: any) => {
    try {
      const API_BASE_URL = API_CONFIG.BASE_URL;
      
      // Transform data based on group type
      let payload = {};
      
      switch (group.id) {
        case 'basic':
          payload = {
            username: data.username,
            location: data.location,
            // Add childhood_nickname to personal_info or create a separate field
            personal_info: {
              childhood_nickname: data.childhood_nickname
            }
          };
          break;
        case 'family':
          payload = {
            family_info: {
              heritage: data.heritage,
              familySize: data.family_size,
              traditions: data.traditions ? data.traditions.split(',').map((t: string) => t.trim()) : []
            }
          };
          break;
        case 'personal':
          payload = {
            personal_info: {
              occupation: data.occupation,
              company: data.company,
              hobbies: data.hobbies ? data.hobbies.split(',').map((h: string) => h.trim()) : []
            }
          };
          break;
        case 'education':
          payload = {
            education: {
              highSchool: data.high_school,
              university: data.university,
              degree: data.degree
            }
          };
          break;
        case 'stories':
          payload = {
            stories: [
              data.migration_story && {
                title: "Family Migration",
                content: data.migration_story,
                category: "heritage"
              },
              data.family_business && {
                title: "Family Business",
                content: data.family_business,
                category: "profession"
              },
              data.memorable_relatives && {
                title: "Memorable Relatives",
                content: data.memorable_relatives,
                category: "family"
              }
            ].filter(Boolean)
          };
          break;
      }

      const response = await fetch(`${API_BASE_URL}${group.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.log(`Failed to save ${group.title}:`, result.message);
      } else {
        console.log(`✅ ${group.title} saved successfully`);
      }
    } catch (error) {
      console.error(`Error saving ${group.title}:`, error);
    }
  };

  const handlePrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      // Load previous answers
      const prevGroupId = questionGroups[currentGroupIndex - 1].id;
      setCurrentAnswers(responses[prevGroupId] || {});
    }
  };

  const getRequiredCount = () => {
    return currentGroup.questions.filter(q => q.required).length;
  };

  const getAnsweredRequiredCount = () => {
    return currentGroup.questions
      .filter(q => q.required)
      .filter(q => currentAnswers[q.field]?.trim()).length;
  };

  const canProceed = () => {
    const requiredAnswered = getAnsweredRequiredCount();
    const totalRequired = getRequiredCount();
    return requiredAnswered === totalRequired;
  };

  const renderQuestion = (question: any, index: number) => {
    const value = currentAnswers[question.field] || '';
    
    return (
      <View key={question.field} style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {index + 1}</Text>
          {question.required && <Text style={styles.requiredTag}>Required</Text>}
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        {question.type === 'select' ? (
          <View style={styles.selectContainer}>
            {question.options?.map((option: string) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  value === option && styles.selectOptionSelected
                ]}
                onPress={() => handleAnswerChange(question.field, option)}
              >
                <Text style={[
                  styles.selectOptionText,
                  value === option && styles.selectOptionTextSelected
                ]}>
                  {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={[
              styles.input,
              question.type === 'multiline' && styles.multilineInput
            ]}
            value={value}
            onChangeText={(text) => handleAnswerChange(question.field, text)}
            placeholder={question.placeholder}
            placeholderTextColor="rgba(252, 211, 170, 0.4)"
            multiline={question.type === 'multiline'}
            numberOfLines={question.type === 'multiline' ? 4 : 1}
            textAlignVertical={question.type === 'multiline' ? 'top' : 'center'}
          />
        )}
        
        <TouchableOpacity
          style={styles.skipQuestionButton}
          onPress={() => handleAnswerChange(question.field, '')}
        >
          <Text style={styles.skipQuestionText}>Skip this question</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dotted Background */}
      <View style={styles.dottedBackground}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern
              id="dots2"
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
          <Rect width="100%" height="100%" fill="url(#dots2)" />
        </Svg>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip setup</Text>
            </TouchableOpacity>
          </View>
          
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Profile Setup</Text>
              <Text style={styles.progressText}>
                {currentGroupIndex + 1} of {questionGroups.length} sections
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Current Group Info */}
          <View style={[styles.groupHeader, { borderLeftColor: currentGroup.color }]}>
            <View style={styles.groupIconContainer}>
              <Ionicons name={currentGroup.icon as any} size={24} color={currentGroup.color} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupTitle}>{currentGroup.title}</Text>
              <Text style={styles.groupSubtitle}>
                {getAnsweredRequiredCount()} of {getRequiredCount()} required questions answered
              </Text>
            </View>
          </View>

          {/* Questions */}
          <View style={styles.questionsContainer}>
            {currentGroup.questions.map((question, index) => renderQuestion(question, index))}
          </View>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            <View style={styles.navigationButtons}>
              {currentGroupIndex > 0 && (
                <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
                  <Ionicons name="chevron-back" size={20} color="#0091ad" />
                  <Text style={styles.prevButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  !canProceed() && styles.nextButtonDisabled
                ]}
                onPress={handleNext}
                disabled={!canProceed() || loading}
              >
                <Text style={styles.nextButtonText}>
                  {currentGroupIndex === questionGroups.length - 1 ? 
                    (loading ? 'Completing...' : 'Complete Profile') : 
                    'Next Section'
                  }
                </Text>
                <Ionicons 
                  name={currentGroupIndex === questionGroups.length - 1 ? "checkmark-circle" : "chevron-forward"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
            
            {!canProceed() && getRequiredCount() > 0 && (
              <Text style={styles.validationText}>
                Please answer all required questions to continue
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: { 
    flex: 1,
  },
  content: { 
    paddingHorizontal: 24, 
    paddingTop: 60, 
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(252, 211, 170, 0.7)',
    textDecorationLine: 'underline',
  },

  // Progress
  progressContainer: {
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(252, 211, 170, 0.7)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0091ad',
    borderRadius: 2,
  },

  // Group Header
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 170, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fcd3aa',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.7)',
  },

  // Questions
  questionsContainer: {
    gap: 24,
    marginBottom: 40,
  },
  questionContainer: {
    backgroundColor: 'rgba(252, 211, 170, 0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#04a7c7',
    textTransform: 'uppercase',
  },
  requiredTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0091ad',
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
    marginBottom: 16,
    lineHeight: 22,
  },

  // Input
  input: {
    fontSize: 16,
    color: '#fcd3aa',
    fontWeight: '400',
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Select Options
  selectContainer: {
    gap: 8,
    marginBottom: 12,
  },
  selectOption: {
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    borderColor: '#0091ad',
  },
  selectOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(252, 211, 170, 0.8)',
    textAlign: 'center',
  },
  selectOptionTextSelected: {
    color: '#0091ad',
    fontWeight: '600',
  },

  // Skip Question
  skipQuestionButton: {
    alignSelf: 'flex-end',
  },
  skipQuestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(252, 211, 170, 0.5)',
    textDecorationLine: 'underline',
  },

  // Navigation
  navigationContainer: {
    marginTop: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.3)',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0091ad',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0091ad',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ff6b6b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});