import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont, COLORS } from '../../config/constants';
import { Person } from './Person';

const { width, height } = Dimensions.get('window');

interface ComprehensivePersonModalProps {
  visible: boolean;
  person: Person | null;
  onClose: () => void;
  onEdit: (person: Person) => void;
  onAddChild: () => void;
  onOpenDocuments?: (person: Person) => void;
}

export const ComprehensivePersonModal: React.FC<ComprehensivePersonModalProps> = ({
  visible,
  person,
  onClose,
  onEdit,
  onAddChild,
  onOpenDocuments,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'family' | 'media'>('overview');

  if (!person) return null;

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = Math.floor((end.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return age;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const age = calculateAge(person.dateOfBirth, person.dateOfDeath);
  const isAlive = person.isAlive !== false && !person.dateOfDeath;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            {/* Life Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Life Details</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>Born</Text>
                  <Text style={styles.detailValue}>{formatDate(person.dateOfBirth)}</Text>
                  <Text style={styles.detailLocation}>{person.placeOfBirth || 'Unknown'}</Text>
                </View>
                
                {person.dateOfDeath && (
                  <View style={styles.detailCard}>
                    <Ionicons name="flower-outline" size={20} color={COLORS.error} />
                    <Text style={styles.detailLabel}>Died</Text>
                    <Text style={styles.detailValue}>{formatDate(person.dateOfDeath)}</Text>
                    <Text style={styles.detailLocation}>{person.burialPlace || 'Unknown'}</Text>
                  </View>
                )}
                
                {person.currentLocation && isAlive && (
                  <View style={styles.detailCard}>
                    <Ionicons name="location-outline" size={20} color={COLORS.success} />
                    <Text style={styles.detailLabel}>Lives in</Text>
                    <Text style={styles.detailValue}>{person.currentLocation}</Text>
                  </View>
                )}
                
                {person.profession && (
                  <View style={styles.detailCard}>
                    <Ionicons name="briefcase-outline" size={20} color={COLORS.secondary} />
                    <Text style={styles.detailLabel}>Profession</Text>
                    <Text style={styles.detailValue}>{person.profession}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Biography */}
            {person.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Story</Text>
                <View style={styles.storyCard}>
                  <Text style={styles.storyText}>{person.bio}</Text>
                </View>
              </View>
            )}

            {/* Achievements */}
            {person.achievements && person.achievements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achievementsContainer}>
                  {person.achievements.map((achievement, index) => (
                    <View key={index} style={styles.achievementChip}>
                      <Ionicons name="trophy" size={14} color={COLORS.warning} />
                      <Text style={styles.achievementText}>{achievement}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 'family':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Family Tree</Text>
              <View style={styles.familyGrid}>
                <TouchableOpacity style={styles.familyCard}>
                  <View style={styles.familyIcon}>
                    <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.familyLabel}>Parents</Text>
                  <Text style={styles.familyCount}>{person.parents?.length || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.familyCard}>
                  <View style={styles.familyIcon}>
                    <Ionicons name="heart-outline" size={24} color={COLORS.error} />
                  </View>
                  <Text style={styles.familyLabel}>Spouse</Text>
                  <Text style={styles.familyCount}>{person.spouse ? '1' : '0'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.familyCard}>
                  <View style={styles.familyIcon}>
                    <Ionicons name="person-add-outline" size={24} color={COLORS.success} />
                  </View>
                  <Text style={styles.familyLabel}>Children</Text>
                  <Text style={styles.familyCount}>{person.children?.length || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.familyCard}>
                  <View style={styles.familyIcon}>
                    <Ionicons name="people-circle-outline" size={24} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.familyLabel}>Siblings</Text>
                  <Text style={styles.familyCount}>{person.siblings?.length || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'media':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photo Gallery</Text>
              {person.photos && person.photos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaGallery}>
                  {person.photos.map((photo, index) => (
                    <TouchableOpacity key={index} style={styles.mediaItem}>
                      <Image source={{ uri: photo }} style={styles.mediaImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No photos yet</Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {person.photo ? (
                    <Image source={{ uri: person.photo }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: person.gender === 'male' ? COLORS.primary : COLORS.secondary }]}>
                      <Text style={styles.avatarInitials}>
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                  )}
                  
                  {/* Status Indicators */}
                  {person.isCurrentUser && (
                    <View style={styles.statusIndicator}>
                      <Ionicons name="star" size={12} color={COLORS.warning} />
                    </View>
                  )}
                  
                  {person.isAIMatched && (
                    <View style={[styles.statusIndicator, styles.aiIndicator]}>
                      <Ionicons name="sparkles" size={10} color={COLORS.accent} />
                    </View>
                  )}
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  {age !== null && (
                    <Text style={styles.personAge}>
                      {isAlive ? `${age} years old` : `Lived ${age} years`}
                    </Text>
                  )}
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: isAlive ? COLORS.success : COLORS.textSecondary }]} />
                    <Text style={styles.statusText}>{isAlive ? 'Living' : 'Deceased'}</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
              {[
                { key: 'overview', label: 'Overview', icon: 'person-outline' },
                { key: 'family', label: 'Family', icon: 'people-outline' },
                { key: 'media', label: 'Media', icon: 'images-outline' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={18} 
                    color={activeTab === tab.key ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.tabButtonText, activeTab === tab.key && styles.activeTabButtonText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Area */}
          <ScrollView 
            style={styles.contentArea}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {renderTabContent()}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(person)}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.text} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.addButton]}
              onPress={onAddChild}
            >
              <Ionicons name="person-add-outline" size={20} color={COLORS.text} />
              <Text style={styles.actionButtonText}>Add Child</Text>
            </TouchableOpacity>

            {onOpenDocuments && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.documentsButton]}
                onPress={() => onOpenDocuments(person)}
              >
                <Ionicons name="document-text-outline" size={20} color={COLORS.text} />
                <Text style={styles.actionButtonText}>Documents</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.92,
    minHeight: height * 0.75,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    opacity: 0.5,
  },
  headerSection: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.textSecondary}20`,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarInitials: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
  },
  statusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  aiIndicator: {
    top: 24,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: COLORS.accent,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  personName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 4,
  },
  personAge: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.surface}80`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: COLORS.background,
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tabContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 2,
  },
  detailLocation: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
  },
  storyCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  storyText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: COLORS.text,
    lineHeight: 24,
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  achievementText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.text,
  },
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  familyCard: {
    width: (width - 72) / 2,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  familyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  familyLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  familyCount: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
  },
  mediaGallery: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  mediaItem: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  actionSection: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textSecondary}20`,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.success,
  },
  documentsButton: {
    backgroundColor: COLORS.secondary,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
});