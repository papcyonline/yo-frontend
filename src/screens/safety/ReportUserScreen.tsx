import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';
import blockingService, { ReportData } from '../../services/BlockingService';
import logger from '../../services/LoggingService';

interface ReportUserScreenProps {
  navigation: any;
  route: any;
}

interface ReportReason {
  id: ReportData['reason'];
  title: string;
  description: string;
  icon: string;
}

const REPORT_REASONS: ReportReason[] = [
  {
    id: 'spam',
    title: 'Spam',
    description: 'Unwanted promotional content or repetitive messages',
    icon: 'megaphone-outline'
  },
  {
    id: 'harassment',
    title: 'Harassment or Bullying',
    description: 'Threatening, intimidating, or abusive behavior',
    icon: 'warning-outline'
  },
  {
    id: 'inappropriate_content',
    title: 'Inappropriate Content',
    description: 'Sexual, violent, or otherwise inappropriate material',
    icon: 'eye-off-outline'
  },
  {
    id: 'fake_profile',
    title: 'Fake Profile',
    description: 'Impersonating someone else or using fake information',
    icon: 'person-remove-outline'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Something else that violates community guidelines',
    icon: 'ellipsis-horizontal-outline'
  }
];

const ReportUserScreen: React.FC<ReportUserScreenProps> = ({ navigation, route }) => {
  const { user, messageId } = route.params || {};
  const { theme, isDark } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportData['reason'] | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    userInfo: {
      padding: 16,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    userInfoText: {
      fontSize: 16,
      fontFamily: getSystemFont('medium'),
      color: theme.text,
      textAlign: 'center',
    },
    userName: {
      fontSize: 18,
      fontFamily: getSystemFont('bold'),
      color: theme.accent,
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      marginBottom: 16,
    },
    reasonItem: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    reasonItemSelected: {
      borderColor: theme.accent,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.05)',
    },
    reasonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    reasonIcon: {
      marginRight: 12,
    },
    reasonTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      flex: 1,
    },
    reasonDescription: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      marginLeft: 44,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: theme.text,
      backgroundColor: theme.surface,
      textAlignVertical: 'top',
      minHeight: 120,
    },
    textInputFocused: {
      borderColor: theme.accent,
    },
    submitButton: {
      margin: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontFamily: getSystemFont('bold'),
      marginLeft: 8,
    },
  });

  const handleReasonSelect = (reason: ReportData['reason']) => {
    setSelectedReason(reason);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: ReportData = {
        reportedUserId: user?.id || user?._id,
        reason: selectedReason,
        description: description.trim(),
        evidence: messageId ? { messageId } : undefined,
      };

      const success = await blockingService.reportUser(reportData);

      if (success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for reporting this issue. Our team will review it and take appropriate action.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      logger.error('Failed to submit report:', error);
      Alert.alert('Error', 'Failed to submit report. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user?.fullName || user?.username}? They will no longer be able to contact you or see your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await blockingService.blockUser(
                user?.id || user?._id,
                user?.fullName || user?.username,
                selectedReason || 'other'
              );

              if (success) {
                Alert.alert(
                  'User Blocked',
                  `${user?.fullName || user?.username} has been blocked.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Error', 'Failed to block user. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Error: No user information provided</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.accent }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Report User</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={dynamicStyles.userInfo}>
          <Text style={dynamicStyles.userInfoText}>
            You're reporting{' '}
            <Text style={dynamicStyles.userName}>
              {user?.fullName || user?.username || 'this user'}
            </Text>
          </Text>
        </View>

        {/* Report Reasons */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Why are you reporting this user?</Text>
          
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                dynamicStyles.reasonItem,
                selectedReason === reason.id && dynamicStyles.reasonItemSelected
              ]}
              onPress={() => handleReasonSelect(reason.id)}
            >
              <View style={dynamicStyles.reasonHeader}>
                <Ionicons
                  name={reason.icon as any}
                  size={24}
                  color={selectedReason === reason.id ? theme.accent : theme.textSecondary}
                  style={dynamicStyles.reasonIcon}
                />
                <Text style={dynamicStyles.reasonTitle}>{reason.title}</Text>
                {selectedReason === reason.id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                )}
              </View>
              <Text style={dynamicStyles.reasonDescription}>{reason.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Additional Details</Text>
          <TextInput
            style={dynamicStyles.textInput}
            placeholder="Please provide specific details about the issue..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
          <Text style={[dynamicStyles.reasonDescription, { textAlign: 'right', marginTop: 8 }]}>
            {description.length}/500
          </Text>
        </View>

        {/* Block User Option */}
        <View style={dynamicStyles.section}>
          <TouchableOpacity
            style={[dynamicStyles.reasonItem, { borderColor: '#ff6b6b' }]}
            onPress={handleBlockUser}
          >
            <View style={dynamicStyles.reasonHeader}>
              <Ionicons
                name="ban-outline"
                size={24}
                color="#ff6b6b"
                style={dynamicStyles.reasonIcon}
              />
              <Text style={[dynamicStyles.reasonTitle, { color: '#ff6b6b' }]}>
                Block this user
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#ff6b6b" />
            </View>
            <Text style={dynamicStyles.reasonDescription}>
              Prevent them from contacting you or seeing your profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          dynamicStyles.submitButton,
          (!selectedReason || !description.trim() || isSubmitting) && dynamicStyles.submitButtonDisabled
        ]}
        onPress={handleSubmitReport}
        disabled={!selectedReason || !description.trim() || isSubmitting}
      >
        <LinearGradient
          colors={['#0091ad', '#04a7c7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={dynamicStyles.submitButtonContent}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="flag" size={20} color="#ffffff" />
              <Text style={dynamicStyles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  content: {
    flex: 1,
  },
});

export default ReportUserScreen;