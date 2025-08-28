// src/screens/settings/HelpSupport.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supportService, FAQItem } from '../../services/supportService';
import { getSystemFont } from '../../config/constants';

interface HelpSupportProps {
  navigation: any;
  route: any;
}

const HelpSupport: React.FC<HelpSupportProps> = ({ navigation, route }) => {
  const { user, darkMode = false } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load FAQ data on mount
  useEffect(() => {
    loadFAQData();
  }, []);

  const loadFAQData = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading FAQ data...');
      const faqItems = await supportService.getFAQ();
      console.log('✅ FAQ data loaded:', faqItems.length, 'items');
      setFaqData(faqItems);
    } catch (error) {
      console.error('❌ Failed to load FAQ:', error);
      // Use default FAQ data if API fails
      setFaqData([
        {
          id: '1',
          question: 'How do I add family members?',
          answer: 'Go to the Family tab and tap the "+" button. You can invite family members by email or phone number.',
          category: 'family'
        },
        {
          id: '2',
          question: 'How do I change my privacy settings?',
          answer: 'Navigate to Settings > Privacy Settings. Here you can control who can see your profile and information.',
          category: 'privacy'
        },
        {
          id: '3',
          question: 'Can I delete my account?',
          answer: 'Yes, you can delete your account from Settings > Account Actions > Delete Account.',
          category: 'account'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const supportOptions = [
    {
      id: 'faq',
      title: 'FAQ',
      subtitle: 'Find answers to common questions',
      icon: 'help-circle',
      color: '#015b01'
    },
    {
      id: 'contact',
      title: 'Contact Support',
      subtitle: 'Get help from our support team',
      icon: 'mail',
      color: '#015b01'
    },
    {
      id: 'community',
      title: 'Community Guidelines',
      subtitle: 'Learn about our community rules',
      icon: 'people',
      color: '#015b01'
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield-checkmark',
      color: '#015b01'
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'View our terms and conditions',
      icon: 'document-text',
      color: '#015b01'
    },
    {
      id: 'status',
      title: 'Service Status',
      subtitle: 'Check if our services are running',
      icon: 'pulse',
      color: '#059669'
    }
  ];

  const filteredFAQs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportOptionPress = (optionId: string) => {
    switch (optionId) {
      case 'faq':
        // Already on this screen, scroll to FAQ section
        break;
      case 'contact':
        setShowContactModal(true);
        break;
      case 'community':
        Alert.alert(
          'Community Guidelines',
          'Our community guidelines help create a safe and welcoming environment for all users.\n\n• Be respectful and kind\n• No harassment or bullying\n• No spam or inappropriate content\n• Respect privacy and consent\n• Report violations when you see them'
        );
        break;
      case 'privacy':
        Linking.openURL('https://familyconnect.com/privacy');
        break;
      case 'terms':
        Linking.openURL('https://familyconnect.com/terms');
        break;
      case 'status':
        Alert.alert(
          'Service Status',
          'All services are currently operational.\n\n✅ App Services\n✅ Messaging\n✅ Notifications\n✅ File Sharing\n\nLast updated: Just now'
        );
        break;
    }
  };

  const handleContactSubmit = () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message fields');
      return;
    }

    // Here you would typically send the support request to your backend
    Alert.alert(
      'Support Request Sent',
      'Thank you for contacting us! We will respond within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowContactModal(false);
            setContactSubject('');
            setContactMessage('');
            setSelectedCategory('general');
          }
        }
      ]
    );
  };

  const SupportOption = ({
    title,
    subtitle,
    icon,
    color,
    onPress
  }: {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.supportOption, darkMode && styles.supportOptionDark]}
      onPress={onPress}
    >
      <View style={[styles.supportIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.supportContent}>
        <Text style={[styles.supportTitle, darkMode && styles.supportTitleDark]}>
          {title}
        </Text>
        <Text style={[styles.supportSubtitle, darkMode && styles.supportSubtitleDark]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={darkMode ? '#6b7280' : '#9ca3af'}
      />
    </TouchableOpacity>
  );

  const FAQItem = ({ item }: { item: FAQItem }) => {
    const isExpanded = expandedFAQ === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.faqItem, darkMode && styles.faqItemDark]}
        onPress={() => setExpandedFAQ(isExpanded ? null : item.id)}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, darkMode && styles.faqQuestionDark]}>
            {item.question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={darkMode ? '#6b7280' : '#9ca3af'}
          />
        </View>
        {isExpanded && (
          <Text style={[styles.faqAnswer, darkMode && styles.faqAnswerDark]}>
            {item.answer}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, darkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#015b01" />
        <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>Loading Help & Support...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            How can we help?
          </Text>
          <View style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
            {supportOptions.map((option) => (
              <SupportOption
                key={option.id}
                title={option.title}
                subtitle={option.subtitle}
                icon={option.icon}
                color={option.color}
                onPress={() => handleSupportOptionPress(option.id)}
              />
            ))}
          </View>
        </View>

        {/* Search FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Search FAQ
          </Text>
          <View style={[styles.searchContainer, darkMode && styles.searchContainerDark]}>
            <Ionicons
              name="search"
              size={20}
              color={darkMode ? '#6b7280' : '#9ca3af'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, darkMode && styles.searchInputDark]}
              placeholder="Search frequently asked questions..."
              placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* FAQ List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Frequently Asked Questions
          </Text>
          <View style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <FAQItem key={faq.id} item={faq} />
              ))
            ) : (
              <View style={styles.noResults}>
                <Ionicons
                  name="search"
                  size={48}
                  color={darkMode ? '#6b7280' : '#9ca3af'}
                />
                <Text style={[styles.noResultsText, darkMode && styles.noResultsTextDark]}>
                  No FAQs found matching your search
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={[styles.emergencySection, darkMode && styles.emergencySectionDark]}>
          <Ionicons name="warning" size={24} color="#ef4444" />
          <View style={styles.emergencyContent}>
            <Text style={[styles.emergencyTitle, darkMode && styles.emergencyTitleDark]}>
              Need immediate help?
            </Text>
            <Text style={[styles.emergencyText, darkMode && styles.emergencyTextDark]}>
              For urgent issues, call our 24/7 support line:
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:+1-800-FAMILY')}
            >
              <Text style={styles.emergencyPhone}>+1-800-FAMILY</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={[styles.modalContainer, darkMode && styles.modalContainerDark]}>
          <View style={[styles.modalHeader, darkMode && styles.modalHeaderDark]}>
            <TouchableOpacity
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, darkMode && styles.modalTitleDark]}>
              Contact Support
            </Text>
            <TouchableOpacity onPress={handleContactSubmit}>
              <Text style={styles.modalSendText}>Send</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Category
              </Text>
              <View style={[styles.categoryContainer, darkMode && styles.categoryContainerDark]}>
                {['general', 'technical', 'account', 'billing', 'feature'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive,
                      darkMode && styles.categoryButtonDark,
                      selectedCategory === category && darkMode && styles.categoryButtonActiveDark
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === category && styles.categoryButtonTextActive,
                        darkMode && styles.categoryButtonTextDark,
                        selectedCategory === category && darkMode && styles.categoryButtonTextActiveDark
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Subject
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                value={contactSubject}
                onChangeText={setContactSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
                Message
              </Text>
              <TextInput
                style={[styles.textArea, darkMode && styles.textAreaDark]}
                value={contactMessage}
                onChangeText={setContactMessage}
                placeholder="Please describe your issue in detail..."
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.responseInfo}>
              <Ionicons name="time" size={16} color="#059669" />
              <Text style={[styles.responseText, darkMode && styles.responseTextDark]}>
                We typically respond within 24 hours
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  headerPlaceholder: {
    width: 40,
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionContentDark: {
    backgroundColor: '#1f2937',
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  supportOptionDark: {
    borderBottomColor: '#374151',
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 2,
  },
  supportTitleDark: {
    color: '#f9fafb',
  },
  supportSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
  supportSubtitleDark: {
    color: '#9ca3af',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchContainerDark: {
    backgroundColor: '#1f2937',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
  },
  searchInputDark: {
    color: '#f9fafb',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqItemDark: {
    borderBottomColor: '#374151',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  faqQuestionDark: {
    color: '#f9fafb',
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    marginTop: 12,
    lineHeight: 20,
  },
  faqAnswerDark: {
    color: '#9ca3af',
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsTextDark: {
    color: '#9ca3af',
  },
  emergencySection: {
    margin: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  emergencySectionDark: {
    backgroundColor: '#1f2937',
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ef4444',
    marginBottom: 4,
  },
  emergencyTitleDark: {
    color: '#f87171',
  },
  emergencyText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#7f1d1d',
    marginBottom: 8,
  },
  emergencyTextDark: {
    color: '#fca5a5',
  },
  emergencyPhone: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ef4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContainerDark: {
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderDark: {
    borderBottomColor: '#374151',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#111827',
  },
  modalTitleDark: {
    color: '#f9fafb',
  },
  modalSendText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#015b01',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryContainerDark: {
    // No specific dark styles needed
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  categoryButtonActive: {
    backgroundColor: '#015b01',
    borderColor: '#015b01',
  },
  categoryButtonActiveDark: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#6b7280',
  },
  categoryButtonTextDark: {
    color: '#d1d5db',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  categoryButtonTextActiveDark: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#f9fafb',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
    minHeight: 120,
  },
  textAreaDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#f9fafb',
  },
  responseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  responseText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#059669',
    marginLeft: 8,
  },
  responseTextDark: {
    color: '#86efac',
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#374151',
    marginTop: 16,
  },
  loadingTextDark: {
    color: '#d1d5db',
  },
});

export default HelpSupport;