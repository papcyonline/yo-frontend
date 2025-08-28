// src/screens/main/components/EditPersonModal.tsx
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
import { Person } from '../types/Person';
import { getSystemFont } from '../../config/constants';

interface EditPersonModalProps {
  visible: boolean;
  person: Person | null;
  onClose: () => void;
  onSave: () => void;
  onPersonChange: (person: Person | null) => void;
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  visible,
  person,
  onClose,
  onSave,
  onPersonChange,
}) => {
  if (!person) return null;

  const handleSave = () => {
    onSave();
    onClose();
  };

  const updateField = (field: keyof Person, value: any) => {
    onPersonChange({
      ...person,
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
          
          <Text style={styles.modalTitle}>Edit Profile</Text>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Basic Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={person.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Full name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Birth Date</Text>
              <TextInput
                style={styles.formInput}
                value={person.birthDate || ''}
                onChangeText={(text) => updateField('birthDate', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Birth Place</Text>
              <TextInput
                style={styles.formInput}
                value={person.birthPlace || ''}
                onChangeText={(text) => updateField('birthPlace', text)}
                placeholder="City, Country"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Current Location</Text>
              <TextInput
                style={styles.formInput}
                value={person.currentLocation || ''}
                onChangeText={(text) => updateField('currentLocation', text)}
                placeholder="City, Country"
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          {/* Professional Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Professional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Profession</Text>
              <TextInput
                style={styles.formInput}
                value={person.profession || ''}
                onChangeText={(text) => updateField('profession', text)}
                placeholder="Your profession"
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Biography</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={person.bio || ''}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell your story..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Life Status Section */}
          {!person.isAlive && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Memorial Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Death Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={person.deathDate || ''}
                  onChangeText={(text) => updateField('deathDate', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Burial Place</Text>
                <TextInput
                  style={styles.formInput}
                  value={person.burialPlace || ''}
                  onChangeText={(text) => updateField('burialPlace', text)}
                  placeholder="Cemetery, City"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>
          )}

          {/* Status Toggle */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Status</Text>
            
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  person.isAlive && styles.activeStatusButton,
                ]}
                onPress={() => updateField('isAlive', true)}
              >
                <Ionicons 
                  name="heart" 
                  size={20} 
                  color={person.isAlive ? '#ffffff' : '#6b7280'} 
                />
                <Text style={[
                  styles.statusText,
                  person.isAlive && styles.activeStatusText,
                ]}>
                  Living
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  !person.isAlive && styles.activeStatusButton,
                ]}
                onPress={() => updateField('isAlive', false)}
              >
                <Ionicons 
                  name="rose" 
                  size={20} 
                  color={!person.isAlive ? '#ffffff' : '#6b7280'} 
                />
                <Text style={[
                  styles.statusText,
                  !person.isAlive && styles.activeStatusText,
                ]}>
                  Deceased
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
  saveButton: {
    backgroundColor: '#04a7c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  bottomSpacing: {
    height: 40,
  },
});