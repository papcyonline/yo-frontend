import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { Person } from './Person';

const { width } = Dimensions.get('window');

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

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    
    return age;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const age = calculateAge(person.dateOfBirth, person.dateOfDeath);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={person.gender === 'male' ? ['#4A90E2', '#357ABD'] : ['#E24A90', '#C73E73']}
              style={styles.headerGradient}
            />
            
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Family Member</Text>
              
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => onEdit(person)}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Photo and Basic Info */}
            <View style={styles.photoSection}>
              <View style={[styles.photoContainer, { borderColor: person.gender === 'male' ? '#4A90E2' : '#E24A90' }]}>
                {person.photo ? (
                  <Image source={{ uri: person.photo }} style={styles.photo} />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: person.gender === 'male' ? '#4A90E2' : '#E24A90' }]}>
                    <Ionicons 
                      name={person.gender === 'male' ? 'man' : 'woman'} 
                      size={60} 
                      color="#FFFFFF" 
                    />
                  </View>
                )}
                
                {person.isAIMatched && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFD700" />
                    <Text style={styles.aiBadgeText}>AI Match</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.personName}>{person.name}</Text>
              
              {age && (
                <Text style={styles.ageText}>
                  {person.dateOfDeath ? `Lived ${age} years` : `${age} years old`}
                </Text>
              )}
              
              {person.isCurrentUser && (
                <View style={styles.currentUserBadge}>
                  <Ionicons name="person" size={12} color="#FFFFFF" />
                  <Text style={styles.currentUserText}>You</Text>
                </View>
              )}
            </View>

            {/* Life Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Life Details</Text>
              
              {person.dateOfBirth && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Born</Text>
                    <Text style={styles.detailValue}>{formatDate(person.dateOfBirth)}</Text>
                  </View>
                </View>
              )}
              
              {person.placeOfBirth && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Birth Place</Text>
                    <Text style={styles.detailValue}>{person.placeOfBirth}</Text>
                  </View>
                </View>
              )}
              
              {person.dateOfDeath && (
                <View style={styles.detailRow}>
                  <Ionicons name="flower-outline" size={18} color="#666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Passed Away</Text>
                    <Text style={styles.detailValue}>{formatDate(person.dateOfDeath)}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Ionicons name="transgender-outline" size={18} color="#666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailValue}>{person.gender === 'male' ? 'Male' : 'Female'}</Text>
                </View>
              </View>
            </View>

            {/* Biography */}
            {person.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Biography</Text>
                <Text style={styles.bioText}>{person.bio}</Text>
              </View>
            )}

            {/* Family Connections */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Family Connections</Text>
              
              <View style={styles.connectionRow}>
                <Ionicons name="people-outline" size={18} color="#666" />
                <View style={styles.connectionContent}>
                  <Text style={styles.connectionLabel}>Children</Text>
                  <Text style={styles.connectionValue}>
                    {person.children?.length || 0} {person.children?.length === 1 ? 'child' : 'children'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.connectionRow}>
                <Ionicons name="git-network-outline" size={18} color="#666" />
                <View style={styles.connectionContent}>
                  <Text style={styles.connectionLabel}>Parents</Text>
                  <Text style={styles.connectionValue}>
                    {person.parents?.length || 0} {person.parents?.length === 1 ? 'parent' : 'parents'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.connectionRow}>
                <Ionicons name="people-circle-outline" size={18} color="#666" />
                <View style={styles.connectionContent}>
                  <Text style={styles.connectionLabel}>Siblings</Text>
                  <Text style={styles.connectionValue}>
                    {person.siblings?.length || 0} {person.siblings?.length === 1 ? 'sibling' : 'siblings'}
                  </Text>
                </View>
              </View>
              
              {person.spouse && (
                <View style={styles.connectionRow}>
                  <Ionicons name="heart-outline" size={18} color="#666" />
                  <View style={styles.connectionContent}>
                    <Text style={styles.connectionLabel}>Spouse</Text>
                    <Text style={styles.connectionValue}>Married</Text>
                  </View>
                </View>
              )}
            </View>

            {/* AI Matching Info */}
            {person.isAIMatched && person.matchConfidence && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Match Information</Text>
                <View style={styles.aiMatchInfo}>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${person.matchConfidence}%` }]} />
                  </View>
                  <Text style={styles.confidenceText}>
                    {person.matchConfidence}% confidence match
                  </Text>
                  <Text style={styles.aiDescription}>
                    This person was matched using AI analysis based on family patterns, names, and genealogical data.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.addChildButton]} 
              onPress={onAddChild}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Child</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButtonAction]} 
              onPress={() => onEdit(person)}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
  },
  header: {
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#FFD700',
    fontFamily: getSystemFont('medium'),
  },
  personName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  ageText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  currentUserText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: getSystemFont('medium'),
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#333',
  },
  bioText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#333',
    lineHeight: 24,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  connectionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#333',
  },
  connectionValue: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#666',
  },
  aiMatchInfo: {
    padding: 16,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#4A90E2',
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#666',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  addChildButton: {
    backgroundColor: '#34C759',
  },
  editButtonAction: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
});