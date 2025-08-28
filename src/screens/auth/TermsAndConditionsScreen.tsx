import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../../services/settingsService';
import { getSystemFont } from '../../config/constants';
import { useTranslation } from '../../i18n/simpleI18n';

const { height, width } = Dimensions.get('window');

// Default content functions
const getDefaultTermsContent = () => {
    return `TERMS OF SERVICE

Last Updated: January 2025

Welcome to Yo! Fam - a family connection and heritage discovery platform.

1. ACCEPTANCE OF TERMS
By creating an account or using Yo! Fam ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.

2. DESCRIPTION OF SERVICE
Yo! Fam is a social networking platform designed to help users:
• Connect with family members and relatives
• Discover and explore family heritage
• Share family stories and memories
• Build meaningful family relationships
• Access AI-powered family matching

3. ELIGIBILITY
You must be at least 13 years old to use this Service. If you are under 18, you must have parental consent to use the Service. By using the Service, you represent that you meet these age requirements.

4. ACCOUNT REGISTRATION
• You must provide accurate and complete information when creating your account
• You are responsible for maintaining the confidentiality of your account credentials
• You are responsible for all activities that occur under your account
• You must notify us immediately of any unauthorized use of your account

5. USER CONTENT AND PRIVACY
• You retain ownership of all content you post on the Service
• By posting content, you grant Yo! Fam a license to use, display, and share that content within the platform
• You agree not to post content that is illegal, harmful, or violates others' rights
• Our Privacy Policy explains how we collect, use, and protect your personal information

6. FAMILY CONNECTIONS AND MATCHING
• Our AI-powered matching system helps connect you with potential relatives
• Matches are based on information you provide and are not guaranteed to be accurate
• You are responsible for verifying any family connections made through the Service
• We are not responsible for the accuracy of family tree information or genealogical data

7. PROHIBITED CONDUCT
You agree not to:
• Use the Service for any illegal or unauthorized purpose
• Harass, abuse, or harm other users
• Post false or misleading information about yourself or others
• Attempt to gain unauthorized access to the Service or other users' accounts
• Use automated systems to access the Service without permission
• Collect or store personal information about other users without consent

8. INTELLECTUAL PROPERTY
• The Service and its features are owned by Yo! Fam and protected by intellectual property laws
• You may not copy, modify, or distribute our proprietary content without permission
• User-generated content remains owned by users but may be used by the Service as outlined in these Terms

9. DATA AND PRIVACY
• We collect and process personal data as described in our Privacy Policy
• You control what family information you choose to share
• We implement security measures to protect your personal and family data
• You can request deletion of your data as outlined in our Privacy Policy

10. TERMINATION
• You may terminate your account at any time
• We may suspend or terminate your account for violations of these Terms
• Upon termination, some of your data may be retained as described in our Privacy Policy

11. LIMITATION OF LIABILITY
Yo! Fam is provided "as is" without warranties. We are not liable for:
• Accuracy of family matching or genealogical information
• Interactions between users
• Loss of data or content
• Indirect or consequential damages

12. MODIFICATIONS TO TERMS
We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use of the Service after changes constitutes acceptance of the new Terms.

13. CONTACT INFORMATION
For questions about these Terms, please contact us at:
• Email: support@yofam.app
• Support: In-app help center

By using Yo! Fam, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`;
};

const getDefaultPrivacyContent = () => {
    return `PRIVACY POLICY

Last Updated: January 2025

Welcome to Yo! Fam. This Privacy Policy explains how we collect, use, protect, and share your information when you use our family connection platform.

1. INFORMATION WE COLLECT

Personal Information:
• Name, email address, phone number
• Profile photos and family photos
• Birthdate and location information
• Family tree and genealogical data
• Voice recordings (for AI features)
• Stories and memories you share

Usage Information:
• How you use the app and its features
• Device information and identifiers
• Log files and analytics data
• Location data (with permission)

Family Data:
• Relationship information you provide
• Family member details you add
• DNA or genetic information (if provided)
• Heritage and cultural information

2. HOW WE USE YOUR INFORMATION

To Provide Our Services:
• Create and maintain your account
• Connect you with potential relatives
• Power AI-matching algorithms
• Enable family tree building
• Facilitate communication between users

To Improve Our Services:
• Analyze usage patterns
• Develop new features
• Improve matching accuracy
• Enhance user experience
• Provide customer support

To Communicate With You:
• Send important service updates
• Notify you of potential matches
• Respond to your inquiries
• Share family connection opportunities

3. INFORMATION SHARING AND DISCLOSURE

We Do NOT Sell Your Data. We may share information:

With Other Users:
• Profile information you choose to make visible
• Family connections you confirm
• Stories and content you share publicly
• Basic contact information for verified matches

With Service Providers:
• Cloud storage and hosting providers
• Analytics and performance monitoring
• Customer support platforms
• Payment processors (for premium features)

For Legal Requirements:
• To comply with applicable laws
• To respond to legal requests
• To protect user safety and security
• To prevent fraud and abuse

4. YOUR PRIVACY CONTROLS

You Can:
• Control what information is visible to others
• Choose which family members to connect with
• Delete content you've shared
• Request account deletion
• Opt out of certain communications
• Manage location sharing settings

Family Tree Privacy:
• Set visibility levels for family information
• Control who can see relationship connections
• Choose whether to appear in other users' matches
• Manage sharing of photos and stories

5. DATA SECURITY

We protect your information using:
• Encryption for data transmission and storage
• Secure servers and databases
• Regular security assessments
• Access controls and authentication
• Incident response procedures

Family data requires special protection, and we implement additional safeguards for sensitive genealogical and personal information.

6. CHILDREN'S PRIVACY

• Our Service requires users to be at least 13 years old
• Users under 18 need parental consent
• We do not knowingly collect data from children under 13
• Parents can request deletion of their child's data
• Special protections apply to minors' family information

7. DATA RETENTION

We retain your information:
• While your account is active
• As needed to provide services
• To comply with legal obligations
• For legitimate business purposes
• Until you request deletion

Deleted accounts may retain some anonymized data for platform improvement and security purposes.

8. INTERNATIONAL DATA TRANSFERS

Your information may be processed in countries other than your own. We ensure adequate protection through:
• Standard contractual clauses
• Adequacy decisions
• Certification schemes
• Other legal transfer mechanisms

9. CHANGES TO THIS POLICY

We may update this Privacy Policy to reflect changes in our practices or applicable laws. We will:
• Notify you of material changes
• Post the updated policy in the app
• Provide additional notice for significant changes
• Give you time to review changes before they take effect

10. YOUR RIGHTS

Depending on your location, you may have rights including:
• Access to your personal information
• Correction of inaccurate data
• Deletion of your information
• Portability of your data
• Objection to processing
• Restriction of processing

11. CONTACT US

For privacy-related questions or requests:
• Email: privacy@yofam.app
• In-app support center
• Mailing address: [Company Address]

To exercise your privacy rights or report concerns, please use the contact information above. We will respond within the timeframes required by applicable law.

This Privacy Policy is designed to help you understand how Yo! Fam handles your family and personal information responsibly.`;
};

const TermsAndConditionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsContent, setTermsContent] = useState<string>(getDefaultTermsContent());
  const [privacyContent, setPrivacyContent] = useState<string>(getDefaultPrivacyContent());
  const [loading, setLoading] = useState(false); // Start with false since we have default content
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Always use default content for now since backend might not be ready
      console.log('📝 Loading default Terms and Privacy content');
      setTermsContent(getDefaultTermsContent());
      setPrivacyContent(getDefaultPrivacyContent());
      
      // Optional: Try to load from backend but don't fail if it doesn't work
      try {
        const terms = await settingsService.getTermsOfService();
        if (terms?.content) {
          setTermsContent(terms.content);
        }
      } catch (error) {
        console.log('Backend terms not available, using default');
      }

      try {
        const privacy = await settingsService.getPrivacyPolicy();
        if (privacy?.content) {
          setPrivacyContent(privacy.content);
        }
      } catch (error) {
        console.log('Backend privacy not available, using default');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!termsAccepted || !privacyAccepted) {
      Alert.alert(
        'Accept Required',
        'Please read and accept both Terms of Service and Privacy Policy to continue.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('SignUp');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0091ad" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.blackBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms.termsOfService')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.contentText}>
            {activeTab === 'terms' ? `TERMS OF SERVICE

Welcome to Yo! Fam - Your Family Connection Platform

Last Updated: January 2025

By creating an account or using the Yo! Fam application, you ("User") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.

1. ACCEPTANCE OF TERMS
By accessing and using Yo! Fam, you accept and agree to be bound by the terms and provisions of this agreement. These Terms apply to all visitors, users, and others who access or use the service.

2. DESCRIPTION OF SERVICE
Yo! Fam is a family connection platform that helps users discover relatives, build family trees, share memories, and connect with their heritage. Our services include:
• AI-powered family matching
• Genealogy and family tree building
• Photo and story sharing
• Heritage discovery tools
• Secure family communications

3. ELIGIBILITY AND REGISTRATION
You must be at least 13 years old to use this service. If you are under 18, you must have parental consent. By registering, you agree to:
• Provide accurate and complete information
• Maintain the security of your account credentials
• Notify us immediately of any unauthorized access
• Accept responsibility for all activities under your account

4. USER CONDUCT AND RESPONSIBILITIES
You agree to use Yo! Fam responsibly and not to:
• Violate any applicable laws or regulations
• Harass, abuse, or harm other users
• Share false or misleading information about yourself or family members
• Infringe upon others' privacy or intellectual property rights
• Attempt to gain unauthorized access to our systems
• Use automated tools to access the service without permission

5. FAMILY DATA AND CONNECTIONS
• Our AI matching system connects you with potential relatives based on provided information
• Matches are suggestions only and accuracy is not guaranteed
• You are responsible for verifying family connections
• Respect others' privacy when sharing family information
• You may control what family data is visible to other users

6. CONTENT OWNERSHIP AND USAGE
• You retain ownership of all content you upload (photos, stories, family information)
• By posting content, you grant Yo! Fam a license to display and share it within our platform
• You may not post content that violates others' rights or is illegal
• We reserve the right to remove inappropriate content
• Backup your important family data as we are not responsible for data loss

7. PRIVACY AND DATA PROTECTION
• Your privacy is important to us - see our Privacy Policy for details
• We implement security measures to protect your personal and family data
• You can control sharing settings and visibility of your information
• We do not sell your personal data to third parties
• You have rights to access, correct, and delete your data

8. INTELLECTUAL PROPERTY
• Yo! Fam and its features are protected by intellectual property laws
• You may not copy, modify, or distribute our proprietary content
• Respect the intellectual property rights of other users
• Report any copyright violations to our support team

9. PROHIBITED ACTIVITIES
Users may not:
• Create fake accounts or impersonate others
• Spam or send unsolicited messages to other users
• Collect other users' personal information without consent
• Interfere with the proper functioning of the service
• Violate the privacy or safety of family members

10. SERVICE AVAILABILITY
• We strive to maintain service availability but cannot guarantee uninterrupted access
• We may update, modify, or discontinue features with notice
• Scheduled maintenance may temporarily affect service availability
• We are not liable for service interruptions or technical issues

11. TERMINATION
• You may delete your account at any time through the app settings
• We may suspend or terminate accounts for violations of these Terms
• Upon termination, some data may be retained as required by law
• You remain responsible for activities that occurred before termination

12. DISCLAIMERS AND LIMITATIONS
• Yo! Fam is provided "as is" without warranties of any kind
• We are not responsible for the accuracy of genealogical information
• Users interact with each other at their own risk
• Our liability is limited to the maximum extent permitted by law
• We do not guarantee specific outcomes from using our matching services

13. CHANGES TO TERMS
• These Terms may be updated from time to time
• We will notify users of material changes through the app
• Continued use after changes constitutes acceptance of new Terms
• You should review these Terms periodically

14. GOVERNING LAW
These Terms shall be governed by applicable laws. Any disputes will be resolved through appropriate legal channels.

15. CONTACT INFORMATION
For questions about these Terms of Service:
• Email: support@yofam.app
• In-app help center
• Legal inquiries: legal@yofam.app

By using Yo! Fam, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.

Thank you for joining the Yo! Fam community and helping preserve family connections across generations.` : privacyContent}
          </Text>
          
        </ScrollView>
      </View>

      {/* Acceptance Checkboxes */}
      <View style={styles.acceptanceContainer}>
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and accept the Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
            {privacyAccepted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and accept the Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            (!termsAccepted || !privacyAccepted) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              termsAccepted && privacyAccepted 
                ? ['#0091ad', '#04a7c7', '#0091ad']
                : ['#333333', '#444444', '#333333']
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
          >
            <Text style={styles.buttonText}>{t('common.continue')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our terms and acknowledge that you have read our privacy policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '400',
    color: '#fcd3aa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0091ad',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.6)',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  contentText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.9)',
    lineHeight: 22,
  },
  acceptanceContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#0091ad',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0091ad',
    borderColor: '#04a7c7',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#fcd3aa',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  continueButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default TermsAndConditionsScreen;