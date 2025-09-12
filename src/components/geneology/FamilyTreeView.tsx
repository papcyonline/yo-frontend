import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import genealogyService from '../../services/genealogyService';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../config/constants';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

interface FamilyTreeViewProps {
  navigation: any;
  route: any;
}

interface FamilyMember {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  generation: number;
  isAlive: boolean;
  bio?: string;
  claimedBy: Array<{
    userId: string;
    relationship: string;
    verificationStatus: string;
  }>;
  userPermissions: {
    canView: boolean;
    canEdit: boolean;
    role: string;
  };
  canClaim: {
    canClaim: boolean;
    reason?: string;
  };
}

const FamilyTreeView: React.FC<FamilyTreeViewProps> = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const { treeId, memberId } = route.params || {};
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyTree();
  }, [treeId]);

  const loadFamilyTree = async () => {
    try {
      setLoading(true);
      
      let members;
      if (treeId) {
        members = await genealogyService.getFamilyMembers(treeId);
      } else if (memberId) {
        // Get the member and then get all members from their tree
        const member = await genealogyService.getFamilyMember(memberId);
        members = await genealogyService.getFamilyMembers(member.familyTreeId);
      }
      
      // Enrich members with permissions and claim status
      const enrichedMembers = members.map(member => ({
        ...member,
        userPermissions: {
          canView: true, // We'll calculate this based on the member data
          canEdit: false,
          role: 'viewer'
        },
        canClaim: { canClaim: true } // We'll calculate this based on the member data
      }));
      
      setFamilyMembers(enrichedMembers);
    } catch (error) {
      console.error('Error loading family tree:', error);
      Alert.alert('Error', 'Failed to load family tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGenerationMembers = (generation: number): FamilyMember[] => {
    return familyMembers.filter(member => member.generation === generation);
  };

  const getGenerationName = (generation: number, members: FamilyMember[]): string => {
    // Find the minimum generation to create relative names
    const minGeneration = Math.min(...familyMembers.map(m => m.generation));
    const relativeGeneration = generation - minGeneration;
    
    const names = [
      'Great Great Grandparents',
      'Great Grandparents', 
      'Grandparents',
      'Parents',
      'Your Generation',
      'Children',
      'Grandchildren',
      'Great Grandchildren'
    ];
    
    return names[relativeGeneration] || `Generation ${generation}`;
  };

  const handleMemberPress = (member: FamilyMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleClaimMember = async (member: FamilyMember, relationship: string) => {
    try {
      await genealogyService.claimFamilyMember(member._id, relationship);
      Alert.alert(
        'Success!',
        `You have successfully claimed ${member.name} as your ${relationship}.`
      );
      setShowMemberModal(false);
      await loadFamilyTree(); // Refresh data
    } catch (error) {
      console.error('Error claiming family member:', error);
      Alert.alert('Error', 'Failed to claim family member. Please try again.');
    }
  };

  const showClaimOptions = (member: FamilyMember) => {
    const relationships = [
      { label: 'This is me', value: 'self' },
      { label: 'My parent', value: 'parent' },
      { label: 'My child', value: 'child' },
      { label: 'My sibling', value: 'sibling' },
      { label: 'My spouse', value: 'spouse' },
      { label: 'My relative', value: 'relative' },
    ];

    Alert.alert(
      'Claim Family Member',
      `How is ${member.name} related to you?`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...relationships.map(rel => ({
          text: rel.label,
          onPress: () => handleClaimMember(member, rel.value)
        }))
      ]
    );
  };

  const renderMember = (member: FamilyMember) => {
    const isClaimed = member.claimedBy && member.claimedBy.length > 0;
    const isClaimedByUser = member.claimedBy?.some(claim => claim.userId === user?._id);

    return (
      <TouchableOpacity
        key={member._id}
        style={[
          styles.memberCard,
          isClaimedByUser && styles.memberCardClaimed
        ]}
        onPress={() => handleMemberPress(member)}
      >
        <View style={styles.memberImageContainer}>
          {member.photo ? (
            <Image source={{ uri: member.photo }} style={styles.memberImage} />
          ) : (
            <View style={styles.memberImagePlaceholder}>
              <Ionicons name="person" size={30} color={COLORS.textSecondary} />
            </View>
          )}
          
          {/* Status indicators */}
          {isClaimed && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: isClaimedByUser ? COLORS.primary : COLORS.success }
            ]}>
              <Ionicons 
                name={isClaimedByUser ? "star" : "checkmark"} 
                size={12} 
                color="#ffffff" 
              />
            </View>
          )}
        </View>
        
        <Text style={styles.memberName} numberOfLines={2}>
          {member.name}
        </Text>
        
        {member.dateOfBirth && (
          <Text style={styles.memberDetails}>
            Born {new Date(member.dateOfBirth).getFullYear()}
          </Text>
        )}
        
        {!member.isAlive && (
          <Text style={styles.memberDeceased}>Deceased</Text>
        )}

        {/* Claim button */}
        {!isClaimedByUser && member.canClaim?.canClaim && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => showClaimOptions(member)}
          >
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        )}

        {isClaimedByUser && (
          <View style={styles.yourMemberBadge}>
            <Text style={styles.yourMemberText}>You</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGeneration = (generation: number) => {
    const members = getGenerationMembers(generation);
    if (members.length === 0) return null;

    return (
      <View key={generation} style={styles.generationContainer}>
        <Text style={styles.generationTitle}>
          {getGenerationName(generation, members)}
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.generationMembers}
        >
          {members.map(renderMember)}
        </ScrollView>
      </View>
    );
  };

  // Get all unique generations and sort them
  const generations = [...new Set(familyMembers.map(m => m.generation))].sort((a, b) => a - b);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, '#04a7c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Family Tree</Text>
            <Text style={styles.headerSubtitle}>
              {familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Family Tree Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.treeContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading family tree...</Text>
          </View>
        ) : (
          generations.map(renderGeneration)
        )}
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal
        visible={showMemberModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedMember && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowMemberModal(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Family Member</Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.memberProfile}>
                    {selectedMember.photo ? (
                      <Image source={{ uri: selectedMember.photo }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" size={40} color={COLORS.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.profileName}>{selectedMember.name}</Text>
                    {selectedMember.bio && (
                      <Text style={styles.profileBio}>{selectedMember.bio}</Text>
                    )}
                  </View>

                  {selectedMember.claimedBy && selectedMember.claimedBy.length > 0 && (
                    <View style={styles.claimsSection}>
                      <Text style={styles.claimsSectionTitle}>Claimed by:</Text>
                      {selectedMember.claimedBy.map((claim, index) => (
                        <View key={index} style={styles.claimItem}>
                          <Ionicons 
                            name="person-circle" 
                            size={20} 
                            color={claim.verificationStatus === 'verified' ? COLORS.success : COLORS.warning} 
                          />
                          <Text style={styles.claimText}>
                            Relationship: {claim.relationship}
                            {claim.verificationStatus === 'verified' && ' (verified)'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    {selectedMember.canClaim?.canClaim && (
                      <TouchableOpacity
                        style={styles.modalClaimButton}
                        onPress={() => {
                          setShowMemberModal(false);
                          showClaimOptions(selectedMember);
                        }}
                      >
                        <Ionicons name="link" size={20} color="#ffffff" />
                        <Text style={styles.modalClaimButtonText}>Claim This Person</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.modalViewButton}
                      onPress={() => {
                        setShowMemberModal(false);
                        // Navigate to full profile view
                      }}
                    >
                      <Text style={styles.modalViewButtonText}>View Full Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  treeContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  generationContainer: {
    marginBottom: 30,
  },
  generationTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  generationMembers: {
    paddingHorizontal: 10,
    gap: 16,
  },
  memberCard: {
    width: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberCardClaimed: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  memberImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  memberImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  memberImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  memberName: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  memberDeceased: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 2,
  },
  claimButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimButtonText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  yourMemberBadge: {
    marginTop: 8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yourMemberText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    minHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  memberProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  claimsSection: {
    marginBottom: 24,
  },
  claimsSectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 12,
  },
  claimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  claimText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  modalActions: {
    gap: 12,
  },
  modalClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalClaimButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  modalViewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalViewButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.primary,
  },
});

export default FamilyTreeView;