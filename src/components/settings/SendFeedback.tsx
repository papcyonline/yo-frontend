// src/screens/settings/SendFeedback.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supportService } from '../../services/supportService';
import { useAuthStore } from '../../store/authStore';
import { getSystemFont } from '../../config/constants';

interface SendFeedbackProps {
  navigation: any;
  route: any;
}

const SendFeedback: React.FC<SendFeedbackProps> = ({ navigation, route }) => {
  const { user, darkMode = false } = route.params || {};
  const { token } = useAuthStore();

  const [feedbackType, setFeedbackType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(false);
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    {
      id: 'bug',
      title: 'Bug Report',
      description: 'Report a problem or error',
      icon: 'bug',
      color: '#ef4444'
    },
    {
      id: 'feature',
      title: 'Feature Request',
      description: 'Suggest a new feature',
      icon: 'bulb',
      color: '#f59e0b'
    },
    {
      id: 'improvement',
      title: 'Improvement',
      description: 'Suggest how to make something better',
      icon: 'trending-up',
      color: '#3b82f6'
    },
    {
      id: 'general',
      title: 'General Feedback',
      description: 'Share your thoughts',
      icon: 'chatbubble',
      color: '#059669'
    },
    {
      id: 'compliment',
      title: 'Compliment',
      description: 'Tell us what you love',
      icon: 'heart',
      color: '#ec4899'
    }
  ];

  const handleSubmitFeedback = async () => {
    if (!subject.trim()) {
      Alert.alert('Required Field', 'Please enter a subject for your feedback');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Required Field', 'Please enter your feedback message');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📝 Submitting feedback...');
      
      await supportService.submitFeedback(token, {
        feedbackType: feedbackType as any,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim(),
        rating: rating > 0 ? rating : undefined,
        includeDeviceInfo,
        includeLogs
      });

      console.log('✅ Feedback submitted successfully');

      Alert.alert(
        'Feedback Sent!',
        'Thank you for your feedback. We appreciate you taking the time to help us improve YoFam.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const FeedbackTypeOption = ({ type }: { type: any }) => (
    <TouchableOpacity
      style={[
        styles.typeOption,
        darkMode && styles.typeOptionDark,
        feedbackType === type.id && styles.typeOptionSelected,
        feedbackType === type.id && darkMode && styles.typeOptionSelectedDark
      ]}
      onPress={() => setFeedbackType(type.id)}
    >
      <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
        <Ionicons name={type.icon as any} size={24} color={type.color} />
      </View>
      <View style={styles.typeContent}>
        <Text style={[
          styles.typeTitle,
          darkMode && styles.typeTitleDark,
          feedbackType === type.id && styles.typeTitleSelected
        ]}>
          {type.title}
        </Text>
        <Text style={[
          styles.typeDescription,
          darkMode && styles.typeDescriptionDark,
          feedbackType === type.id && styles.typeDescriptionSelected
        ]}>
          {type.description}
        </Text>
      </View>
      <View style={[
        styles.radioButton,
        darkMode && styles.radioButtonDark,
        feedbackType === type.id && styles.radioButtonSelected
      ]}>
        {feedbackType === type.id && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  const StarRating = () => (
    <View style={styles.ratingContainer}>
      <Text style={[styles.ratingLabel, darkMode && styles.ratingLabelDark]}>
        How would you rate your overall experience?
      </Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#f59e0b' : (darkMode ? '#6b7280' : '#d1d5db')}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={[styles.ratingText, darkMode && styles.ratingTextDark]}>
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitFeedback}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feedback Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            What type of feedback do you have?
          </Text>
          <View style={styles.typesList}>
            {feedbackTypes.map((type) => (
              <FeedbackTypeOption key={type.id} type={type} />
            ))}
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <View style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
            <StarRating />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Contact Information
          </Text>
          <View style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Email Address
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Feedback Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Feedback Details
          </Text>
          <View style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Subject
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief summary of your feedback"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Message
              </Text>
              <TextInput
                style={[styles.textArea, darkMode && styles.textAreaDark]}
                value={message}
                onChangeText={setMessage}
                placeholder="Please provide detailed feedback. The more information you give us, the better we can help!"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Additional Options
          </Text>
          <View style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
            <View style={[styles.optionItem, darkMode && styles.optionItemDark]}>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, darkMode && styles.optionTitleDark]}>
                  Include Device Information
                </Text>
                <Text style={[styles.optionDescription, darkMode && styles.optionDescriptionDark]}>
                  Help us diagnose issues by including your device model and app version
                </Text>
              </View>
              <Switch
                value={includeDeviceInfo}
                onValueChange={setIncludeDeviceInfo}
                trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                thumbColor={includeDeviceInfo ? '#015b01' : '#f3f4f6'}
              />
            </View>

            {feedbackType === 'bug' && (
              <View style={[styles.optionItem, darkMode && styles.optionItemDark]}>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, darkMode && styles.optionTitleDark]}>
                    Include Debug Logs
                  </Text>
                  <Text style={[styles.optionDescription, darkMode && styles.optionDescriptionDark]}>
                    Include technical logs to help identify the bug (no personal data)
                  </Text>
                </View>
                <Switch
                  value={includeLogs}
                  onValueChange={setIncludeLogs}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={includeLogs ? '#015b01' : '#f3f4f6'}
                />
              </View>
            )}
          </View>
        </View>

        {/* Feedback Guidelines */}
        <View style={[styles.guidelinesSection, darkMode && styles.guidelinesSectionDark]}>
          <Text style={[styles.guidelinesTitle, darkMode && styles.guidelinesTitleDark]}>
            Feedback Guidelines
          </Text>
          <View style={styles.guidelinesList}>
            <Text style={[styles.guideline, darkMode && styles.guidelineDark]}>
              • Be specific about what you experienced
            </Text>
            <Text style={[styles.guideline, darkMode && styles.guidelineDark]}>
              • Include steps to reproduce bugs
            </Text>
            <Text style={[styles.guideline, darkMode && styles.guidelineDark]}>
              • Mention your device and app version for technical issues
            </Text>
            <Text style={[styles.guideline, darkMode && styles.guidelineDark]}>
              • Be constructive and respectful
            </Text>
            <Text style={[styles.guideline, darkMode && styles.guidelineDark]}>
              • One topic per feedback submission
            </Text>
          </View>
        </View>

        {/* Response Time Info */}
        <View style={[styles.responseInfo, darkMode && styles.responseInfoDark]}>
          <Ionicons name="time" size={20} color="#059669" />
          <View style={styles.responseContent}>
            <Text style={[styles.responseTitle, darkMode && styles.responseTitleDark]}>
              Response Time
            </Text>
            <Text style={[styles.responseText, darkMode && styles.responseTextDark]}>
              We typically respond to feedback within 2-3 business days. Bug reports and critical issues are prioritized.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    backgroundColor: '#015b01',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerDark: {
    backgroundColor: '#1f2937',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  submitButton: {
    padding: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionContentDark: {
    backgroundColor: '#1f2937',
  },
  typesList: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  typeOptionDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  typeOptionSelected: {
    borderColor: '#015b01',
    backgroundColor: '#f0fdf4',
  },
  typeOptionSelectedDark: {
    borderColor: '#059669',
    backgroundColor: '#1f2937',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 2,
  },
  typeTitleDark: {
    color: '#f9fafb',
  },
  typeTitleSelected: {
    color: '#015b01',
  },
  typeDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
  typeDescriptionDark: {
    color: '#9ca3af',
  },
  typeDescriptionSelected: {
    color: '#059669',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonDark: {
    borderColor: '#6b7280',
  },
  radioButtonSelected: {
    borderColor: '#015b01',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#015b01',
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingLabelDark: {
    color: '#f9fafb',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#f59e0b',
    marginTop: 8,
  },
  ratingTextDark: {
    color: '#fbbf24',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#f9fafb',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionItemDark: {
    borderBottomColor: '#374151',
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 2,
  },
  optionTitleDark: {
    color: '#f9fafb',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
  optionDescriptionDark: {
    color: '#9ca3af',
  },
  guidelinesSection: {
    margin: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  guidelinesSectionDark: {
    backgroundColor: '#1f2937',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#059669',
    marginBottom: 12,
  },
  guidelinesTitleDark: {
    color: '#86efac',
  },
  guidelinesList: {
    marginLeft: 8,
  },
  guideline: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#047857',
    marginBottom: 6,
    lineHeight: 20,
  },
  guidelineDark: {
    color: '#6ee7b7',
  },
  responseInfo: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  responseInfoDark: {
    backgroundColor: '#1f2937',
  },
  responseContent: {
    flex: 1,
    marginLeft: 12,
  },
  responseTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 4,
  },
  responseTitleDark: {
    color: '#f9fafb',
  },
  responseText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    lineHeight: 20,
  },
  responseTextDark: {
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SendFeedback;