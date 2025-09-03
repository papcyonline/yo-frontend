import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import { API_CONFIG, API_ENDPOINTS } from '../../../constants/api';
import { COLORS } from '../../../config/constants';
import { apiService } from '../../../services/api';

interface QAReviewProps {
  navigation: any;
  route: any;
}

interface Question {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayName: string;
  placeholder: string;
  icon: string;
  multiline?: boolean;
}

const ProfileQAReviewScreen: React.FC<QAReviewProps> = ({ navigation }) => {
  const { user, token } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editValue, setEditValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [showMissingQuestions, setShowMissingQuestions] = useState(true);

  // Define question mapping with better display names and organization
  // NOTE: Excluded registration fields (date_of_birth, current_location, full_name, username)
  // These are collected during registration and should not appear in questionnaire
  const questionMapping = {
    // Personal Information
    personal_bio: { displayName: 'Personal Bio', category: 'Personal', icon: 'person', placeholder: 'Tell us about yourself', multiline: true },
    childhood_nickname: { displayName: 'Childhood Nickname', category: 'Personal', icon: 'happy', placeholder: 'Your childhood nickname' },
    gender: { displayName: 'Gender', category: 'Personal', icon: 'person', placeholder: 'Your gender' },
    
    // Family Information
    father_name: { displayName: 'Father\'s Name', category: 'Family', icon: 'man', placeholder: 'Your father\'s name' },
    mother_name: { displayName: 'Mother\'s Name', category: 'Family', icon: 'woman', placeholder: 'Your mother\'s name' },
    siblings_relatives: { displayName: 'Siblings & Relatives', category: 'Family', icon: 'people', placeholder: 'Tell us about your siblings and relatives', multiline: true },
    family_stories: { displayName: 'Family Stories', category: 'Family', icon: 'library', placeholder: 'Share your family stories and traditions', multiline: true },
    family_traditions: { displayName: 'Family Traditions', category: 'Family', icon: 'heart', placeholder: 'Your family traditions and customs', multiline: true },
    
    // Childhood & Memories
    childhood_memories: { displayName: 'Childhood Memories', category: 'Childhood', icon: 'bicycle', placeholder: 'Share your favorite childhood memories', multiline: true },
    kindergarten_memories: { displayName: 'Kindergarten Memories', category: 'Childhood', icon: 'school', placeholder: 'Tell us about your kindergarten days', multiline: true },
    childhood_friends: { displayName: 'Childhood Friends', category: 'Childhood', icon: 'people', placeholder: 'Who were your childhood friends?', multiline: true },
    
    // Skills & Interests
    hobbies: { displayName: 'Hobbies & Interests', category: 'Interests', icon: 'football', placeholder: 'What are your hobbies and interests?', multiline: true },
    languages_dialects: { displayName: 'Languages & Dialects', category: 'Interests', icon: 'chatbubbles', placeholder: 'What languages do you speak?', multiline: true },
    religious_background: { displayName: 'Religious Background', category: 'Interests', icon: 'leaf', placeholder: 'Your religious or spiritual background' },
    profession: { displayName: 'Profession/Career', category: 'Professional', icon: 'briefcase', placeholder: 'What do you do for work?' },
    
    // Education
    primary_school: { displayName: 'Primary School', category: 'Education', icon: 'school', placeholder: 'Where did you attend primary school?' },
    secondary_school: { displayName: 'Secondary School', category: 'Education', icon: 'school', placeholder: 'Where did you attend secondary/high school?' },
    university_college: { displayName: 'University/College', category: 'Education', icon: 'library', placeholder: 'Where did you attend university or college?' },
    educational_background: { displayName: 'Educational Background', category: 'Education', icon: 'medal', placeholder: 'Tell us about your educational journey', multiline: true },
  };

  useEffect(() => {
    fetchQAData();
  }, []);

  const fetchQAData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching Q&A data...');
      
      const result = await apiService.get('/users/onboarding/responses');
      console.log('📥 Q&A fetch result:', result);
      
      if (result && result.success && result.data?.answers) {
        const qaData = Object.entries(result.data.answers)
          .filter(([questionId, answer]) => {
            // Filter out null, undefined, or empty answers
            return answer !== null && answer !== undefined && String(answer).trim() !== '';
          })
          .map(([questionId, answer]) => {
            const mapping = questionMapping[questionId as keyof typeof questionMapping];
            return {
              id: questionId,
              question: mapping?.displayName || questionId,
              answer: String(answer),
              category: mapping?.category || 'Other',
              displayName: mapping?.displayName || questionId,
              placeholder: mapping?.placeholder || 'Enter your answer',
              icon: mapping?.icon || 'help-circle',
              multiline: mapping?.multiline || false,
            };
          });

        // Group by category and sort
        const sortedData = qaData.sort((a, b) => {
          const categoryOrder = ['Personal', 'Family', 'Childhood', 'Education', 'Interests', 'Professional', 'Other'];
          const catA = categoryOrder.indexOf(a.category);
          const catB = categoryOrder.indexOf(b.category);
          if (catA !== catB) return catA - catB;
          return a.displayName.localeCompare(b.displayName);
        });

        console.log(`✅ Loaded ${sortedData.length} Q&A responses`);
        setQuestions(sortedData);
      } else {
        console.warn('⚠️ No Q&A data found or API returned error:', result);
        setQuestions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching QA data:', error);
      
      let errorMessage = 'Failed to load your responses. Please try again.';
      if (error.message) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditValue(question.answer);
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion || editValue.trim() === '') {
      Alert.alert('Error', 'Please enter a valid answer');
      return;
    }

    try {
      setSaving(true);
      console.log('🔄 Saving Q&A edit:', { questionId: editingQuestion.id, answer: editValue.trim() });

      const result = await apiService.post('/users/onboarding/save-response', {
        questionId: editingQuestion.id,
        answer: editValue.trim(),
        phase: 'core' // Default phase for manual edits
      });
      
      console.log('📤 Save result:', result);
      
      if (result && result.success) {
        // Update the local state
        setQuestions(prev => prev.map(q => 
          q.id === editingQuestion.id 
            ? { ...q, answer: editValue.trim() }
            : q
        ));
        
        // Sync profile data with error handling
        try {
          const { syncProfileFromBackend } = useAuthStore.getState();
          if (syncProfileFromBackend) {
            await syncProfileFromBackend();
            console.log('✅ Profile synced successfully');
          }
        } catch (syncError) {
          console.warn('⚠️ Profile sync failed (non-critical):', syncError);
          // Don't show error to user as the save was successful
        }
        
        setModalVisible(false);
        setEditingQuestion(null);
        setEditValue('');
        
        Alert.alert('Success', 'Your response has been updated!');
      } else {
        const errorMessage = result?.message || 'Failed to save your changes';
        console.error('❌ Save failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('❌ Error saving edit:', error);
      let errorMessage = 'Failed to save your changes. Please try again.';
      
      // Provide more specific error messages
      if (error.message) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQAData();
    setRefreshing(false);
  };

  const getMissingQuestions = () => {
    const answeredQuestionIds = questions.map(q => q.id);
    const allQuestionIds = Object.keys(questionMapping);
    
    return allQuestionIds
      .filter(id => !answeredQuestionIds.includes(id))
      .map(id => {
        const mapping = questionMapping[id as keyof typeof questionMapping];
        return {
          id,
          question: mapping?.displayName || id,
          answer: '',
          category: mapping?.category || 'Other',
          displayName: mapping?.displayName || id,
          placeholder: mapping?.placeholder || 'Enter your answer',
          icon: mapping?.icon || 'help-circle',
          multiline: mapping?.multiline || false,
        };
      })
      .sort((a, b) => {
        const categoryOrder = ['Personal', 'Family', 'Childhood', 'Education', 'Interests', 'Professional', 'Other'];
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.displayName.localeCompare(b.displayName);
      });
  };

  const groupQuestionsByCategory = (questions: Question[]) => {
    return questions.reduce((groups, question) => {
      const category = question.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(question);
      return groups;
    }, {} as Record<string, Question[]>);
  };

  const renderQuestionItem = (question: Question, isMissing = false) => (
    <TouchableOpacity
      key={question.id}
      style={[styles.questionItem, isMissing && styles.missingQuestionItem]}
      onPress={() => handleEditQuestion(question)}
      activeOpacity={0.7}
    >
      <View style={styles.questionHeader}>
        <View style={styles.questionTitleRow}>
          <View style={[
            styles.questionIcon, 
            { backgroundColor: isMissing ? `${COLORS.orange || '#FF9500'}20` : `${COLORS.primary}20` }
          ]}>
            <Ionicons 
              name={isMissing ? "add-circle" : question.icon as any} 
              size={18} 
              color={isMissing ? (COLORS.orange || '#FF9500') : COLORS.primary} 
            />
          </View>
          <View style={styles.questionTitleContainer}>
            <Text style={styles.questionTitle}>{question.displayName}</Text>
            <Text style={[styles.questionId, isMissing && styles.missingQuestionId]}>
              {isMissing ? 'Tap to add' : `#${question.id}`}
            </Text>
          </View>
        </View>
        <Ionicons 
          name={isMissing ? "add" : "create-outline"} 
          size={20} 
          color={isMissing ? (COLORS.orange || '#FF9500') : COLORS.primary} 
        />
      </View>
      
      {!isMissing && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText} numberOfLines={3}>
            {question.answer}
          </Text>
        </View>
      )}
      
      {isMissing && (
        <View style={styles.answerContainer}>
          <Text style={styles.missingAnswerText}>
            {question.placeholder}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategorySection = (category: string, categoryQuestions: Question[], missingQuestions: Question[] = []) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category}</Text>
      {categoryQuestions.map(q => renderQuestionItem(q, false))}
      {missingQuestions.map(q => renderQuestionItem(q, true))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your responses...</Text>
      </View>
    );
  }

  const groupedQuestions = groupQuestionsByCategory(questions);
  const missingQuestions = getMissingQuestions();
  const groupedMissingQuestions = groupQuestionsByCategory(missingQuestions);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Edit Responses</Text>
        <View style={styles.headerRight}>
          <Text style={styles.responseCount}>{questions.length} responses</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Tap any response to edit it. Your changes will be saved and reflected in your profile.
          </Text>
        </View>

        {/* Show answered questions first, then missing questions by category */}
        {Object.keys({ ...groupedQuestions, ...groupedMissingQuestions })
          .sort((a, b) => {
            const categoryOrder = ['Personal', 'Family', 'Childhood', 'Education', 'Interests', 'Professional', 'Other'];
            return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
          })
          .map(category => 
            renderCategorySection(
              category, 
              groupedQuestions[category] || [], 
              showMissingQuestions ? (groupedMissingQuestions[category] || []) : []
            )
          )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Response</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {editingQuestion && (
              <>
                <Text style={styles.editQuestionTitle}>
                  {editingQuestion.displayName}
                </Text>
                
                <TextInput
                  style={[
                    styles.editInput,
                    editingQuestion.multiline && styles.multilineInput
                  ]}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={editingQuestion.placeholder}
                  multiline={editingQuestion.multiline}
                  numberOfLines={editingQuestion.multiline ? 4 : 1}
                  autoFocus={true}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  responseCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  categorySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  questionItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missingQuestionItem: {
    borderStyle: 'dashed',
    borderColor: COLORS.orange || '#FF9500',
    backgroundColor: `${COLORS.orange || '#FF9500'}05`,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionTitleContainer: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  questionId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  missingQuestionId: {
    color: COLORS.orange || '#FF9500',
    fontWeight: '500',
  },
  answerContainer: {
    paddingLeft: 48,
  },
  answerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  missingAnswerText: {
    fontSize: 14,
    color: COLORS.orange || '#FF9500',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editQuestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default ProfileQAReviewScreen;