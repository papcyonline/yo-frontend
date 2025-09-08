import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AISuggestions } from './AISuggestions';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FamilyMember {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  placeOfBirth?: string;
  photo?: string;
  bio?: string;
  gender: 'male' | 'female';
  generation: number;
  position: { x: number; y: number };
  parents?: string[];
  children?: string[];
  siblings?: string[];
  spouse?: string;
  isCurrentUser?: boolean;
  isAIMatched?: boolean;
  matchConfidence?: number;
  userId?: string; // If connected to a registered user
}

interface TreeSuggestion {
  id: string;
  type: 'parent' | 'child' | 'sibling' | 'spouse';
  suggestedMember: FamilyMember;
  confidence: number;
  reason: string;
}

const EnhancedGenealogyScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { user } = useAuthStore();
  
  // Tree state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [suggestions, setSuggestions] = useState<TreeSuggestion[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  
  // Interaction state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Animation refs
  const scaleAnimatedValue = useRef(new Animated.Value(1)).current;
  const translateXAnimatedValue = useRef(new Animated.Value(0)).current;
  const translateYAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeTree();
    loadAISuggestions();
  }, [user]);

  const initializeTree = () => {
    // Initialize with current user and some sample family data
    const currentUserNode: FamilyMember = {
      id: user?._id || 'current-user',
      name: `${user?.first_name} ${user?.last_name}`,
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      dateOfBirth: (user as any)?.dateOfBirth || (user as any)?.date_of_birth,
      placeOfBirth: user?.location,
      photo: user?.profile_photo_url,
      bio: `${user?.profession || 'Professional'} from ${user?.location || 'Unknown location'}`,
      gender: ((user as any)?.gender as 'male' | 'female') || 'male',
      generation: 2, // Middle generation
      position: { x: screenWidth / 2, y: screenHeight / 2 },
      isCurrentUser: true,
      userId: user?._id,
    };

    // Sample family tree data (would be fetched from AI matching service)
    const sampleFamily: FamilyMember[] = [
      currentUserNode,
      // Parents generation
      {
        id: 'father-1',
        name: 'Ahmed Al-Mansouri',
        firstName: 'Ahmed',
        lastName: 'Al-Mansouri',
        dateOfBirth: '1960-03-15',
        placeOfBirth: 'Cairo, Egypt',
        gender: 'male',
        generation: 1,
        position: { x: screenWidth / 2 - 100, y: screenHeight / 2 - 150 },
        children: [currentUserNode.id],
        spouse: 'mother-1',
        isAIMatched: true,
        matchConfidence: 0.85,
      },
      {
        id: 'mother-1',
        name: 'Fatima Al-Mansouri',
        firstName: 'Fatima',
        lastName: 'Al-Mansouri',
        dateOfBirth: '1965-07-22',
        placeOfBirth: 'Alexandria, Egypt',
        gender: 'female',
        generation: 1,
        position: { x: screenWidth / 2 + 100, y: screenHeight / 2 - 150 },
        children: [currentUserNode.id],
        spouse: 'father-1',
        isAIMatched: true,
        matchConfidence: 0.82,
      },
    ];

    setFamilyMembers(sampleFamily);
  };

  const loadAISuggestions = () => {
    // Mock AI suggestions (would be fetched from AI matching service)
    const mockSuggestions: TreeSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'child',
        suggestedMember: {
          id: 'child-suggested-1',
          name: 'Sarah Al-Mansouri',
          firstName: 'Sarah',
          lastName: 'Al-Mansouri',
          dateOfBirth: '2015-05-10',
          gender: 'female',
          generation: 3,
          position: { x: screenWidth / 2, y: screenHeight / 2 + 150 },
          parents: [user?._id || 'current-user'],
        },
        confidence: 0.92,
        reason: 'Based on user profile indicating 1 child and location match',
      },
      {
        id: 'suggestion-2',
        type: 'sibling',
        suggestedMember: {
          id: 'sibling-suggested-1',
          name: 'Omar Al-Mansouri',
          firstName: 'Omar',
          lastName: 'Al-Mansouri',
          dateOfBirth: '1988-12-03',
          gender: 'male',
          generation: 2,
          position: { x: screenWidth / 2 + 150, y: screenHeight / 2 },
          parents: ['father-1', 'mother-1'],
          isAIMatched: true,
          matchConfidence: 0.78,
        },
        confidence: 0.78,
        reason: 'Matched based on parent names and family location data',
      },
    ];

    setSuggestions(mockSuggestions);
  };

  const handlePersonPress = (member: FamilyMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleAddMember = (type: 'parent' | 'child' | 'sibling' | 'spouse') => {
    if (!selectedMember) return;

    const newMember: FamilyMember = {
      id: `new-${Date.now()}`,
      name: '',
      firstName: '',
      lastName: selectedMember.lastName,
      gender: 'male',
      generation: type === 'parent' ? selectedMember.generation - 1 :
                  type === 'child' ? selectedMember.generation + 1 :
                  selectedMember.generation,
      position: {
        x: selectedMember.position.x + (type === 'sibling' ? 120 : 0),
        y: selectedMember.position.y + (
          type === 'parent' ? -120 :
          type === 'child' ? 120 :
          0
        ),
      },
    };

    // Set relationships
    if (type === 'parent') {
      newMember.children = [selectedMember.id];
    } else if (type === 'child') {
      newMember.parents = [selectedMember.id];
    } else if (type === 'sibling') {
      newMember.parents = selectedMember.parents;
      newMember.siblings = [selectedMember.id];
    } else if (type === 'spouse') {
      newMember.spouse = selectedMember.id;
    }

    setEditingMember(newMember);
    setShowMemberModal(false);
    setShowAddMemberModal(true);
  };

  const saveMember = (memberData: FamilyMember) => {
    setFamilyMembers(prev => {
      const existingIndex = prev.findIndex(m => m.id === memberData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = memberData;
        return updated;
      } else {
        return [...prev, memberData];
      }
    });

    setShowAddMemberModal(false);
    setEditingMember(null);
  };

  const acceptSuggestion = (suggestion: TreeSuggestion) => {
    setFamilyMembers(prev => [...prev, suggestion.suggestedMember]);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    Alert.alert('Success', 'Family member added successfully!');
  };

  // Convert TreeSuggestion to AISuggestion format
  const convertToAISuggestions = (treeSuggestions: TreeSuggestion[]) => {
    return treeSuggestions.map(suggestion => ({
      id: suggestion.id,
      name: suggestion.suggestedMember.name,
      relationshipType: suggestion.type as 'parent' | 'sibling' | 'child' | 'spouse',
      confidence: Math.round(suggestion.confidence * 100),
      matchReasons: [
        suggestion.reason,
        'Name pattern analysis',
        'Location and timeline alignment'
      ],
      photo: suggestion.suggestedMember.photo,
      birthYear: suggestion.suggestedMember.dateOfBirth ? 
        new Date(suggestion.suggestedMember.dateOfBirth).getFullYear() : undefined,
      location: suggestion.suggestedMember.placeOfBirth,
      commonConnections: ['Family network analysis'],
      aiAnalysis: `Our AI identified this person as a potential ${suggestion.type} based on ${suggestion.reason.toLowerCase()}. The match shows high confidence due to consistent patterns in family data.`
    }));
  };

  const handleAcceptAISuggestion = (suggestion: any) => {
    // Find the original TreeSuggestion
    const treeSuggestion = suggestions.find(s => s.id === suggestion.id);
    if (treeSuggestion) {
      acceptSuggestion(treeSuggestion);
    }
  };

  const handleRejectAISuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const handleViewMoreSuggestions = () => {
    setShowSuggestionsModal(true);
  };

  const renderFamilyMember = (member: FamilyMember) => {
    const isCurrentUser = member.isCurrentUser;
    const isAIMatched = member.isAIMatched;

    return (
      <TouchableOpacity
        key={member.id}
        style={[
          styles.memberNode,
          {
            left: member.position.x - 40,
            top: member.position.y - 40,
          },
          isCurrentUser && styles.currentUserNode,
          isAIMatched && styles.aiMatchedNode,
        ]}
        onPress={() => handlePersonPress(member)}
      >
        <View style={styles.memberPhoto}>
          {member.photo ? (
            <Image source={{ uri: member.photo }} style={styles.photoImage} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: member.gender === 'male' ? '#4A90E2' : '#E24A90' }]}>
              <Text style={styles.photoText}>
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </Text>
            </View>
          )}
          
          {isCurrentUser && (
            <View style={styles.currentUserBadge}>
              <Ionicons name="person" size={12} color="#FFFFFF" />
            </View>
          )}
          
          {isAIMatched && (
            <View style={styles.aiMatchBadge}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        <Text style={styles.memberName} numberOfLines={2}>
          {member.firstName}
        </Text>
        
        {member.dateOfBirth && (
          <Text style={styles.memberDate}>
            {new Date(member.dateOfBirth).getFullYear()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderConnectionLines = () => {
    const lines: React.JSX.Element[] = [];
    
    familyMembers.forEach(member => {
      // Draw lines to children
      if (member.children) {
        member.children.forEach(childId => {
          const child = familyMembers.find(m => m.id === childId);
          if (child) {
            lines.push(
              <View
                key={`line-${member.id}-${childId}`}
                style={[
                  styles.connectionLine,
                  {
                    left: Math.min(member.position.x, child.position.x),
                    top: Math.min(member.position.y, child.position.y),
                    width: Math.abs(child.position.x - member.position.x),
                    height: Math.abs(child.position.y - member.position.y),
                  }
                ]}
              />
            );
          }
        });
      }
      
      // Draw lines to spouse
      if (member.spouse) {
        const spouse = familyMembers.find(m => m.id === member.spouse);
        if (spouse) {
          lines.push(
            <View
              key={`spouse-${member.id}-${member.spouse}`}
              style={[
                styles.spouseLine,
                {
                  left: Math.min(member.position.x, spouse.position.x),
                  top: member.position.y - 2,
                  width: Math.abs(spouse.position.x - member.position.x),
                }
              ]}
            />
          );
        }
      }
    });
    
    return lines;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Family Heritage</Text>
          <Text style={styles.headerSubtitle}>Al-Mansouri Family Tree</Text>
        </View>
        
        <TouchableOpacity
          style={styles.suggestionsButton}
          onPress={() => setShowSuggestionsModal(true)}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBadge}>
              <Text style={styles.suggestionsBadgeText}>{suggestions.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tree Canvas */}
      <View style={styles.treeContainer}>
        <ScrollView
          style={styles.treeScrollView}
          contentContainerStyle={styles.treeContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          maximumZoomScale={3}
          minimumZoomScale={0.5}
          bouncesZoom={true}
        >
          {/* Connection Lines */}
          {renderConnectionLines()}
          
          {/* Family Members */}
          {familyMembers.map(renderFamilyMember)}
        </ScrollView>
      </View>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <AISuggestions
          suggestions={convertToAISuggestions(suggestions)}
          onAcceptSuggestion={handleAcceptAISuggestion}
          onRejectSuggestion={handleRejectAISuggestion}
          onViewMore={handleViewMoreSuggestions}
          isLoading={false}
        />
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <MaterialIcons name="center-focus-strong" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Member Detail Modal */}
      <Modal
        visible={showMemberModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                  <TouchableOpacity onPress={() => setShowMemberModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  {selectedMember.photo && (
                    <Image source={{ uri: selectedMember.photo }} style={styles.modalPhoto} />
                  )}
                  
                  <Text style={styles.modalDetailTitle}>Personal Information</Text>
                  {selectedMember.dateOfBirth && (
                    <Text style={styles.modalDetail}>Born: {selectedMember.dateOfBirth}</Text>
                  )}
                  {selectedMember.placeOfBirth && (
                    <Text style={styles.modalDetail}>Place: {selectedMember.placeOfBirth}</Text>
                  )}
                  {selectedMember.bio && (
                    <Text style={styles.modalDetail}>Bio: {selectedMember.bio}</Text>
                  )}
                  
                  {selectedMember.isAIMatched && (
                    <View style={styles.aiMatchInfo}>
                      <Ionicons name="sparkles" size={16} color="#4A90E2" />
                      <Text style={styles.aiMatchText}>
                        AI Matched ({(selectedMember.matchConfidence || 0) * 100}% confidence)
                      </Text>
                    </View>
                  )}
                </ScrollView>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addParentButton]}
                    onPress={() => handleAddMember('parent')}
                  >
                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Add Parent</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addChildButton]}
                    onPress={() => handleAddMember('child')}
                  >
                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Add Child</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addSiblingButton]}
                    onPress={() => handleAddMember('sibling')}
                  >
                    <Ionicons name="people" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Add Sibling</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addSpouseButton]}
                    onPress={() => handleAddMember('spouse')}
                  >
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Add Spouse</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* AI Suggestions Modal */}
      <Modal
        visible={showSuggestionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Family Suggestions</Text>
              <TouchableOpacity onPress={() => setShowSuggestionsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {suggestions.map(suggestion => (
                <View key={suggestion.id} style={styles.suggestionItem}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionName}>
                      {suggestion.suggestedMember.name}
                    </Text>
                    <Text style={styles.suggestionType}>
                      ({suggestion.type})
                    </Text>
                  </View>
                  
                  <Text style={styles.suggestionReason}>
                    {suggestion.reason}
                  </Text>
                  
                  <View style={styles.suggestionActions}>
                    <Text style={styles.confidenceText}>
                      {(suggestion.confidence * 100).toFixed(0)}% match
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => acceptSuggestion(suggestion)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  suggestionsButton: {
    padding: 4,
    position: 'relative',
  },
  suggestionsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  treeContainer: {
    flex: 1,
  },
  treeScrollView: {
    flex: 1,
  },
  treeContent: {
    minWidth: screenWidth * 3,
    minHeight: screenHeight * 3,
  },
  memberNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
    height: 100,
  },
  currentUserNode: {
    // Special styling for current user
  },
  aiMatchedNode: {
    // Special styling for AI matched members
  },
  memberPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#333',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  currentUserBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiMatchBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  memberDate: {
    color: '#CCCCCC',
    fontSize: 10,
    textAlign: 'center',
  },
  connectionLine: {
    position: 'absolute',
    backgroundColor: '#333',
    height: 1,
  },
  spouseLine: {
    position: 'absolute',
    backgroundColor: '#E24A90',
    height: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  aiMatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
  },
  aiMatchText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  addParentButton: {
    backgroundColor: '#4A90E2',
  },
  addChildButton: {
    backgroundColor: '#4CAF50',
  },
  addSiblingButton: {
    backgroundColor: '#FF9800',
  },
  addSpouseButton: {
    backgroundColor: '#E24A90',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  suggestionType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  suggestionReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EnhancedGenealogyScreen;