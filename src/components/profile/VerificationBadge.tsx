import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationAPI, VerificationStatus } from '../../services/api/verification';

interface VerificationBadgeProps {
  userId?: string;
  isOwnProfile?: boolean;
  profileCompletionPercentage?: number;
  showApplyButton?: boolean;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  userId,
  isOwnProfile = false,
  profileCompletionPercentage = 0,
  showApplyButton = true,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (isOwnProfile) {
      loadVerificationStatus();
    }
  }, [isOwnProfile]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await VerificationAPI.getVerificationStatus();
      if (response.success && response.data) {
        setVerificationStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForVerification = async () => {
    try {
      setApplying(true);
      const response = await VerificationAPI.applyForVerification();
      
      if (response.success) {
        Alert.alert(
          'Application Submitted! 🎉',
          'Your verification application has been submitted successfully. We will review your request and get back to you.',
          [{ text: 'OK', onPress: () => loadVerificationStatus() }]
        );
      } else {
        Alert.alert('Application Failed', response.message || 'Failed to submit verification application');
      }
    } catch (error: any) {
      console.error('Verification application error:', error);
      Alert.alert('Error', error.message || 'Failed to apply for verification');
    } finally {
      setApplying(false);
    }
  };

  const renderVerificationBadge = () => {
    if (!verificationStatus) return null;

    if (verificationStatus.is_verified) {
      return (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#1DA1F2" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      );
    }

    return null;
  };

  const renderApplyButton = () => {
    if (!isOwnProfile || !showApplyButton || !verificationStatus) return null;

    // Show nothing if not eligible
    if (verificationStatus.profile_completion_percentage < 100) {
      return (
        <View style={styles.notEligibleContainer}>
          <Text style={styles.notEligibleText}>
            Complete your profile 100% to apply for verification
          </Text>
          <Text style={styles.completionText}>
            Current completion: {verificationStatus.profile_completion_percentage}%
          </Text>
        </View>
      );
    }

    // Already verified
    if (verificationStatus.is_verified) {
      return null;
    }

    // Application pending
    if (verificationStatus.verification_status === 'pending') {
      return (
        <View style={styles.pendingContainer}>
          <Ionicons name="time-outline" size={16} color="#F39C12" />
          <Text style={styles.pendingText}>Verification pending review</Text>
        </View>
      );
    }

    // Application rejected
    if (verificationStatus.verification_status === 'rejected') {
      return (
        <View style={styles.rejectedContainer}>
          <Ionicons name="close-circle-outline" size={16} color="#E74C3C" />
          <Text style={styles.rejectedText}>
            Verification application was declined
          </Text>
          {verificationStatus.rejection_reason && (
            <Text style={styles.rejectionReasonText}>
              Reason: {verificationStatus.rejection_reason}
            </Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleApplyForVerification}
            disabled={applying}
          >
            <Text style={styles.retryButtonText}>
              {applying ? 'Applying...' : 'Apply Again'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Eligible to apply
    if (verificationStatus.can_apply_for_verification) {
      return (
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApplyForVerification}
          disabled={applying}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>Apply for Blue Check</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1DA1F2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderVerificationBadge()}
      {renderApplyButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  verifiedText: {
    marginLeft: 4,
    color: '#1DA1F2',
    fontWeight: '600',
    fontSize: 14,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  applyButtonText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  notEligibleContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notEligibleText: {
    color: '#6C757D',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  completionText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '500',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  pendingText: {
    marginLeft: 6,
    color: '#856404',
    fontSize: 12,
    fontWeight: '500',
  },
  rejectedContainer: {
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectedText: {
    color: '#721C24',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  rejectionReasonText: {
    color: '#721C24',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default VerificationBadge;