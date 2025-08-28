// src/screens/main/components/AddChildModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface NewPersonData {
  name: string;
  birthDate: string;
  birthPlace: string;
  isAlive: boolean;
}

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  personData: NewPersonData;
  onDataChange: (data: NewPersonData) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  visible,
  onClose,
  onAdd,
  personData,
  onDataChange,
}) => {
  const handleAdd = () => {
    onAdd();
    onClose();
  };

  const updateField = (field: keyof NewPersonData, value: any) => {
    onDataChange({
      ...personData,
      [field]: value,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Add Family Member</Text>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Instructions */}
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={24} color="#04a7c7" />
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Adding a Family Member</Text>
              <Text style={styles.instructionText}>
                Fill in the information below to add a new family member to the tree. 
                Required fields are marked with an asterisk (*).
              </Text>
            </View>
          </View>

          {/* Basic Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>
                Full Name *
                <Text style={styles.required}> (Required)</Text>
              </Text>
              <TextInput
                style={[styles.formInput, !personData.name.trim() && styles.requiredInput]}
                value={personData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter full name"
                placeholderTextColor="#6b7280"
              />
              {!personData.name.trim() && (
                <Text style={styles.errorText}>Name is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Birth Date</Text>
              <TextInput
                style={styles.formInput}
                value={personData.birthDate}
                onChangeText={(text) => updateField('birthDate', text)}
                placeholder="YYYY-MM-DD (e.g., 1990-05-15)"
                placeholderTextColor="#6b7280"
              />
              <Text style={styles.helperText}>
                Use format: Year-Month-Day (YYYY-MM-DD)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Birth Place</Text>
              <TextInput
                style={styles.formInput}
                value={personData.birthPlace}
                onChangeText={(text) => updateField('birthPlace', text)}
                placeholder="City, Country (e.g., Dubai, UAE)"
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Life Status</Text>
            
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  personData.isAlive && styles.activeStatusButton,
                ]}
                onPress={() => updateField('isAlive', true)}
              >
                <Ionicons 
                  name="heart" 
                  size={20} 
                  color={personData.isAlive ? '#ffffff' : '#6b7280'} 
                />
                <Text style={[
                  styles.statusText,
                  personData.isAlive && styles.activeStatusText,
                ]}>
                  Living
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  !personData.isAlive && styles.activeStatusButton,
                ]}
                onPress={() => updateField('isAlive', false)}
              >
                <Ionicons 
                  name="rose" 
                  size={20} 
                  color={!personData.isAlive ? '#ffffff' : '#6b7280'} 
                />
                <Text style={[
                  styles.statusText,
                  !personData.isAlive && styles.activeStatusText,
                ]}>
                  Deceased
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Add Options */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Quick Add Options</Text>
            
            <View style={styles.quickAddContainer}>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => {
                  updateField('name', 'Son Al-Mansouri');
                  updateField('birthPlace', 'Dubai, UAE');
                  updateField('isAlive', true);
                }}
              >
                <Ionicons name="male" size={20} color="#04a7c7" />
                <Text style={styles.quickAddText}>Add Son</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => {
                  updateField('name', 'Daughter Al-Mansouri');
                  updateField('birthPlace', 'Dubai, UAE');
                  updateField('isAlive', true);
                }}
              >
                <Ionicons name="female" size={20} color="#04a7c7" />
                <Text style={styles.quickAddText}>Add Daughter</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.helperText}>
              Use quick add buttons to pre-fill common information, then customize as needed.
            </Text>
          </View>

          {/* Preview Card */}
          {personData.name.trim() && (
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewImagePlaceholder}>
                  <Text style={styles.previewInitials}>
                    {personData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                  {!personData.isAlive && (
                    <View style={styles.previewDeceasedBadge}>
                      <Ionicons name="rose" size={12} color="#ffffff" />
                    </View>
                  )}
                </View>
                
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{personData.name}</Text>
                  <Text style={styles.previewDetails}>
                    {personData.birthDate ? new Date(personData.birthDate).getFullYear() : '?'} - {' '}
                    {personData.isAlive ? 'Present' : '?'}
                  </Text>
                  {personData.birthPlace && (
                    <Text style={styles.previewLocation}>
                      📍 {personData.birthPlace}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingTop: 50,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#04a7c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(4, 167, 199, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 199, 0.3)',
  },
  instructionContent: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#04a7c7',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#d1d5db',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#d1d5db',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
    fontSize: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    backgroundColor: '#111827',
    color: '#ffffff',
  },
  requiredInput: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#ef4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 8,
  },
  activeStatusButton: {
    backgroundColor: '#04a7c7',
    borderColor: '#04a7c7',
  },
  statusText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#6b7280',
  },
  activeStatusText: {
    color: '#ffffff',
  },
  quickAddContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickAddButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 167, 199, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 199, 0.3)',
    gap: 8,
  },
  quickAddText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#04a7c7',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  previewImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  previewInitials: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  previewDeceasedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  previewDetails: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    marginBottom: 2,
  },
  previewLocation: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 40,
  },
});