// src/components/chat/MediaPicker.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRecordVideo: () => void;
  loading?: boolean;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onPickImage,
  onPickVideo,
  onRecordVideo,
  loading = false
}) => {
  const mediaOptions = [
    {
      id: 'camera',
      icon: 'camera',
      label: 'Camera',
      subtitle: 'Take a photo',
      onPress: onTakePhoto,
      color: '#22c55e'
    },
    {
      id: 'photo',
      icon: 'images',
      label: 'Photo',
      subtitle: 'From gallery',
      onPress: onPickImage,
      color: '#3b82f6'
    },
    {
      id: 'video',
      icon: 'videocam',
      label: 'Video',
      subtitle: 'From gallery (max 1min)',
      onPress: onPickVideo,
      color: '#8b5cf6'
    },
    {
      id: 'record',
      icon: 'radio-button-on',
      label: 'Record',
      subtitle: 'Record video (max 1min)',
      onPress: onRecordVideo,
      color: '#ef4444'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.mediaOptionsContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Media</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsGrid}>
            {mediaOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.mediaOption, { opacity: loading ? 0.5 : 1 }]}
                onPress={option.onPress}
                disabled={loading}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                  <Ionicons name={option.icon as any} size={28} color={option.color} />
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.mediaInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.infoText}>
                Maximum file size: 10MB
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.infoText}>
                Video duration: 1 minute max
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  mediaOptionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area padding
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  mediaOption: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    textAlign: 'center',
  },
  mediaInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
});