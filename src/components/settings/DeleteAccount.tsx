// src/screens/settings/DeleteAccount.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface DeleteAccountProps {
  navigation: any;
  route: any;
}

const DeleteAccount: React.FC<DeleteAccountProps> = ({ navigation, route }) => {
  const { user, darkMode = false } = route.params || {};

  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [downloadData, setDownloadData] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [reasonSelected, setReasonSelected] = useState('');
  const [customReason, setCustomReason] = useState('');

  const deletionReasons = [
    {
      id: 'privacy',
      title: 'Privacy concerns',
      description: 'I\'m concerned about my data privacy'
    },
    {
      id: 'unused',
      title: 'Not using the app',
      description: 'I don\'t use the app anymore'
    },
    {
      id: 'alternative',
      title: 'Found an alternative',
      description: 'I\'m switching to another service'
    },
    {
      id: 'features',
      title: 'Missing features',
      description: 'The app doesn\'t have features I need'
    },
    {
      id: 'technical',
      title: 'Technical issues',
      description: 'I\'m experiencing bugs or performance issues'
    },
    {
      id: 'other',
      title: 'Other',
      description: 'I have a different reason'
    }
  ];

  const handleReasonSelect = (reasonId: string) => {
    setReasonSelected(reasonId);
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!reasonSelected) {
        Alert.alert('Required', 'Please select a reason for deleting your account');
        return;
      }
      if (reasonSelected === 'other' && !customReason.trim()) {
        Alert.alert('Required', 'Please provide your reason for deleting your account');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleDeleteAccount = () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      Alert.alert('Error', 'Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm deletion');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. Your account and all associated data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Here you would typically make an API call to delete the account
            Alert.alert(
              'Account Deleted',
              'Your account has been successfully deleted. We\'re sorry to see you go.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleDataDownload = () => {
    Alert.alert(
      'Download Your Data',
      'We will prepare your data and send you a download link via email within 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Download', 
          onPress: () => {
            setDownloadData(true);
            Alert.alert('Success', 'Data download request submitted!');
          }
        },
      ]
    );
  };

  const ReasonOption = ({ reason }: { reason: any }) => (
    <TouchableOpacity
      style={[
        styles.reasonOption,
        darkMode && styles.reasonOptionDark,
        reasonSelected === reason.id && styles.reasonOptionSelected,
        reasonSelected === reason.id && darkMode && styles.reasonOptionSelectedDark
      ]}
      onPress={() => handleReasonSelect(reason.id)}
    >
      <View style={styles.reasonContent}>
        <Text style={[
          styles.reasonTitle,
          darkMode && styles.reasonTitleDark,
          reasonSelected === reason.id && styles.reasonTitleSelected
        ]}>
          {reason.title}
        </Text>
        <Text style={[
          styles.reasonDescription,
          darkMode && styles.reasonDescriptionDark,
          reasonSelected === reason.id && styles.reasonDescriptionSelected
        ]}>
          {reason.description}
        </Text>
      </View>
      <View style={[
        styles.radioButton,
        darkMode && styles.radioButtonDark,
        reasonSelected === reason.id && styles.radioButtonSelected
      ]}>
        {reasonSelected === reason.id && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="help-circle" size={48} color="#ef4444" />
        <Text style={[styles.stepTitle, darkMode && styles.stepTitleDark]}>
          We're sorry to see you go
        </Text>
        <Text style={[styles.stepSubtitle, darkMode && styles.stepSubtitleDark]}>
          Help us understand why you want to delete your account
        </Text>
      </View>

      <View style={styles.reasonsList}>
        {deletionReasons.map((reason) => (
          <ReasonOption key={reason.id} reason={reason} />
        ))}
      </View>

      {reasonSelected === 'other' && (
        <View style={styles.customReasonContainer}>
          <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
            Please tell us more:
          </Text>
          <TextInput
            style={[styles.textArea, darkMode && styles.textAreaDark]}
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Your reason for deleting your account..."
            placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="download" size={48} color="#f59e0b" />
        <Text style={[styles.stepTitle, darkMode && styles.stepTitleDark]}>
          Download Your Data
        </Text>
        <Text style={[styles.stepSubtitle, darkMode && styles.stepSubtitleDark]}>
          Before deleting your account, you may want to download your data
        </Text>
      </View>

      <View style={[styles.dataInfo, darkMode && styles.dataInfoDark]}>
        <Text style={[styles.dataInfoTitle, darkMode && styles.dataInfoTitleDark]}>
          Your data includes:
        </Text>
        <View style={styles.dataList}>
          <Text style={[styles.dataItem, darkMode && styles.dataItemDark]}>
            • Profile information and photos
          </Text>
          <Text style={[styles.dataItem, darkMode && styles.dataItemDark]}>
            • Messages and conversation history
          </Text>
          <Text style={[styles.dataItem, darkMode && styles.dataItemDark]}>
            • Posts and shared content
          </Text>
          <Text style={[styles.dataItem, darkMode && styles.dataItemDark]}>
            • Family and friend connections
          </Text>
          <Text style={[styles.dataItem, darkMode && styles.dataItemDark]}>
            • App usage and preferences
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.downloadButton, darkMode && styles.downloadButtonDark]}
        onPress={handleDataDownload}
      >
        <Ionicons name="download" size={20} color="#ffffff" />
        <Text style={styles.downloadButtonText}>Request Data Download</Text>
      </TouchableOpacity>

      <View style={[styles.skipOption, darkMode && styles.skipOptionDark]}>
        <Text style={[styles.skipText, darkMode && styles.skipTextDark]}>
          You can skip this step and proceed with deletion
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="warning" size={48} color="#ef4444" />
        <Text style={[styles.stepTitle, darkMode && styles.stepTitleDark]}>
          Confirm Account Deletion
        </Text>
        <Text style={[styles.stepSubtitle, darkMode && styles.stepSubtitleDark]}>
          This action cannot be undone. All your data will be permanently deleted.
        </Text>
      </View>

      <View style={[styles.warningBox, darkMode && styles.warningBoxDark]}>
        <Text style={[styles.warningTitle, darkMode && styles.warningTitleDark]}>
          What will be deleted:
        </Text>
        <Text style={[styles.warningItem, darkMode && styles.warningItemDark]}>
          • Your profile and all personal information
        </Text>
        <Text style={[styles.warningItem, darkMode && styles.warningItemDark]}>
          • All messages and conversations
        </Text>
        <Text style={[styles.warningItem, darkMode && styles.warningItemDark]}>
          • Photos, videos, and shared files
        </Text>
        <Text style={[styles.warningItem, darkMode && styles.warningItemDark]}>
          • Family and friend connections
        </Text>
        <Text style={[styles.warningItem, darkMode && styles.warningItemDark]}>
          • App preferences and settings
        </Text>
      </View>

      <View style={styles.confirmationInputs}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
            Type "DELETE MY ACCOUNT" to confirm:
          </Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            value={confirmationText}
            onChangeText={setConfirmationText}
            placeholder="DELETE MY ACCOUNT"
            placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>
            Enter your password to confirm:
          </Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            value={password}
            onChangeText={setPassword}
            placeholder="Your account password"
            placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
            secureTextEntry
          />
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Progress Indicator */}
      <View style={[styles.progressContainer, darkMode && styles.progressContainerDark]}>
        <View style={styles.progressSteps}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                darkMode && styles.progressCircleDark,
                currentStep >= step && styles.progressCircleActive,
                currentStep >= step && darkMode && styles.progressCircleActiveDark
              ]}>
                <Text style={[
                  styles.progressText,
                  darkMode && styles.progressTextDark,
                  currentStep >= step && styles.progressTextActive
                ]}>
                  {step}
                </Text>
              </View>
              {step < 3 && (
                <View style={[
                  styles.progressLine,
                  darkMode && styles.progressLineDark,
                  currentStep > step && styles.progressLineActive
                ]} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.stepLabels}>
          <Text style={[styles.stepLabel, darkMode && styles.stepLabelDark]}>Reason</Text>
          <Text style={[styles.stepLabel, darkMode && styles.stepLabelDark]}>Data</Text>
          <Text style={[styles.stepLabel, darkMode && styles.stepLabelDark]}>Confirm</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, darkMode && styles.footerDark]}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.backStepButton, darkMode && styles.backStepButtonDark]}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={[styles.backStepText, darkMode && styles.backStepTextDark]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.footerSpacer} />
        
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !reasonSelected && currentStep === 1 && styles.nextButtonDisabled
            ]}
            onPress={handleNextStep}
            disabled={!reasonSelected && currentStep === 1}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 2 ? 'Continue' : 'Next'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!confirmationText || !password) && styles.deleteButtonDisabled
            ]}
            onPress={handleDeleteAccount}
            disabled={!confirmationText || !password}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerDark: {
    backgroundColor: '#7f1d1d',
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
  progressContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressContainerDark: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleDark: {
    backgroundColor: '#374151',
  },
  progressCircleActive: {
    backgroundColor: '#ef4444',
  },
  progressCircleActiveDark: {
    backgroundColor: '#dc2626',
  },
  progressText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#6b7280',
  },
  progressTextDark: {
    color: '#9ca3af',
  },
  progressTextActive: {
    color: '#ffffff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  progressLineDark: {
    backgroundColor: '#374151',
  },
  progressLineActive: {
    backgroundColor: '#ef4444',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#6b7280',
    textAlign: 'center',
    flex: 1,
  },
  stepLabelDark: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  stepTitleDark: {
    color: '#f9fafb',
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepSubtitleDark: {
    color: '#9ca3af',
  },
  reasonsList: {
    marginBottom: 24,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  reasonOptionDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  reasonOptionSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  reasonOptionSelectedDark: {
    borderColor: '#dc2626',
    backgroundColor: '#7f1d1d',
  },
  reasonContent: {
    flex: 1,
    marginRight: 12,
  },
  reasonTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 4,
  },
  reasonTitleDark: {
    color: '#f9fafb',
  },
  reasonTitleSelected: {
    color: '#7f1d1d',
  },
  reasonDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
  reasonDescriptionDark: {
    color: '#9ca3af',
  },
  reasonDescriptionSelected: {
    color: '#991b1b',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonDark: {
    borderColor: '#6b7280',
  },
  radioButtonSelected: {
    borderColor: '#ef4444',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  customReasonContainer: {
    marginTop: 16,
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
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#f9fafb',
  },
  dataInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dataInfoDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  dataInfoTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 12,
  },
  dataInfoTitleDark: {
    color: '#f9fafb',
  },
  dataList: {
    marginLeft: 8,
  },
  dataItem: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    marginBottom: 6,
  },
  dataItemDark: {
    color: '#9ca3af',
  },
  downloadButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  downloadButtonDark: {
    backgroundColor: '#d97706',
  },
  downloadButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginLeft: 8,
  },
  skipOption: {
    alignItems: 'center',
    padding: 16,
  },
  skipOptionDark: {
    // No specific dark styles needed
  },
  skipText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    textAlign: 'center',
  },
  skipTextDark: {
    color: '#9ca3af',
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  warningBoxDark: {
    backgroundColor: '#1f2937',
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#7f1d1d',
    marginBottom: 12,
  },
  warningTitleDark: {
    color: '#f87171',
  },
  warningItem: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#991b1b',
    marginBottom: 6,
  },
  warningItemDark: {
    color: '#fca5a5',
  },
  confirmationInputs: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerDark: {
    backgroundColor: '#1f2937',
    borderTopColor: '#374151',
  },
  backStepButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  backStepButtonDark: {
    borderColor: '#6b7280',
  },
  backStepText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#6b7280',
  },
  backStepTextDark: {
    color: '#d1d5db',
  },
  footerSpacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#015b01',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
});

export default DeleteAccount;