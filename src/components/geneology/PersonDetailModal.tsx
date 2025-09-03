// src/screens/main/components/PersonDetailModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Person } from '../types/Person';
import { getSystemFont } from '../../config/constants';

interface PersonDetailModalProps {
  visible: boolean;
  person: Person | null;
  onClose: () => void;
  onEdit: (person: Person) => void;
  onAddChild: () => void;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  visible,
  person,
  onClose,
  onEdit,
  onAddChild,
}) => {
  if (!person) return null;

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
          
          <Text style={styles.modalTitle}>{person.name}</Text>
          
          {person.isEditable && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(person)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Profile Image */}
          <View style={styles.modalImageContainer}>
            {person.profileImage ? (
              <Image source={{ uri: person.profileImage }} style={styles.modalImage} />
            ) : (
              <View style={styles.modalImagePlaceholder}>
                <Text style={styles.modalInitials}>
                  {person.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            
            {!person.isAlive && (
              <View style={styles.modalDeceasedBadge}>
                <Ionicons name="rose" size={16} color="#ffffff" />
                <Text style={styles.deceasedBadgeText}>In Memory</Text>
              </View>
            )}
          </View>

          {/* Basic Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#04a7c7" />
              <Text style={styles.infoLabel}>Born:</Text>
              <Text style={styles.infoValue}>
                {person.birthDate ? new Date(person.birthDate).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
            
            {!person.isAlive && person.deathDate && (
              <View style={styles.infoRow}>
                <Ionicons name="rose" size={20} color="#ef4444" />
                <Text style={styles.infoLabel}>Passed:</Text>
                <Text style={styles.infoValue}>
                  {new Date(person.deathDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#04a7c7" />
              <Text style={styles.infoLabel}>Born in:</Text>
              <Text style={styles.infoValue}>{person.birthPlace || 'Unknown'}</Text>
            </View>
            
            {person.currentLocation && (
              <View style={styles.infoRow}>
                <Ionicons name="home" size={20} color="#04a7c7" />
                <Text style={styles.infoLabel}>Lives in:</Text>
                <Text style={styles.infoValue}>{person.currentLocation}</Text>
              </View>
            )}
            
            {person.profession && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase" size={20} color="#04a7c7" />
                <Text style={styles.infoLabel}>Profession:</Text>
                <Text style={styles.infoValue}>{person.profession}</Text>
              </View>
            )}
          </View>

          {/* Biography */}
          {person.bio && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Biography</Text>
              <Text style={styles.bioText}>{person.bio}</Text>
            </View>
          )}

          {/* Family */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Family</Text>
            
            <View style={styles.familyInfo}>
              <Text style={styles.familyLabel}>Children: {person.children.length}</Text>
              <TouchableOpacity style={styles.addChildButton} onPress={onAddChild}>
                <Ionicons name="add" size={16} color="#04a7c7" />
                <Text style={styles.addChildText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Photos */}
          {person.photos && person.photos.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <ScrollView horizontal style={styles.photosContainer}>
                {person.photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photoThumbnail} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Achievements */}
          {person.achievements && person.achievements.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              {person.achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <Ionicons name="trophy" size={16} color="#fcd3aa" />
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))}
            </View>
          )}
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
  editButton: {
    backgroundColor: '#04a7c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInitials: {
    fontSize: 40,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  modalDeceasedBadge: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -40,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deceasedBadgeText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginLeft: 4,
  },
  infoSection: {
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#9ca3af',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    flex: 1,
  },
  bioText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#d1d5db',
    lineHeight: 20,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 199, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#04a7c7',
  },
  addChildText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#04a7c7',
    marginLeft: 4,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#d1d5db',
    marginLeft: 8,
    flex: 1,
  },
});