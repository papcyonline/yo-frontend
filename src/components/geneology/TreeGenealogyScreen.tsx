// src/components/geneology/TreeGenealogyScreen.tsx - Fixed getTreeStats Error
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  PanResponder,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Person } from './Person';
import { PersonNode } from './PersonNode';
import { PersonDetailModal } from './PersonDetailModal';
import { EditPersonModal } from './EditPersonModal';
import { AddChildModal } from './AddChildModal';
import { AISuggestions } from './AISuggestions';
import { FamilyTreeSync } from './FamilyTreeSync';
import { useFamilyTree } from './useFamilyTree';
import { getSystemFont } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

interface TreeGenealogyScreenProps {
  navigation: any;
  route: any;
}

interface AISuggestion {
  id: string;
  name: string;
  relationshipType: 'parent' | 'sibling' | 'child' | 'spouse';
  confidence: number;
  matchReasons: string[];
  aiAnalysis: string;
}

const TreeGenealogyScreen: React.FC<TreeGenealogyScreenProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    familyTree,
    selectedPerson,
    setSelectedPerson,
    editingPerson,
    setEditingPerson,
    newPersonData,
    setNewPersonData,
    saveEditedPerson,
    addNewChild,
    handleAddChild,
    getPersonsByGeneration,
    getTreeStats,
  } = useFamilyTree(user);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Initialize AI suggestions
  useEffect(() => {
    if (familyTree && Object.keys(familyTree).length > 0) {
      // Generate AI suggestions based on existing family data
      const suggestions: AISuggestion[] = [
        {
          id: 'ai-1',
          name: 'Ahmed Al-Mansouri',
          relationshipType: 'parent',
          confidence: 89,
          matchReasons: ['Name pattern analysis', 'Regional data match', 'Age correlation'],
          aiAnalysis: 'High confidence match based on UAE genealogy records and naming patterns.',
        },
        {
          id: 'ai-2', 
          name: 'Fatima Al-Mansouri',
          relationshipType: 'sibling',
          confidence: 75,
          matchReasons: ['Shared family name', 'Location match', 'Generation analysis'],
          aiAnalysis: 'Potential sibling match with moderate confidence based on family structure.',
        },
      ];
      setAiSuggestions(suggestions);
    }
  }, [familyTree]);

  const handlePersonPress = (person: Person) => {
    setSelectedPerson(person);
    setShowPersonModal(true);
  };

  const handleEditPress = (person: Person) => {
    setEditingPerson({ ...person });
    setShowPersonModal(false);
    setShowEditModal(true);
  };

  const handleAddChildPress = () => {
    setShowPersonModal(false);
    setShowAddChildModal(true);
  };

  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    // Convert AI suggestion to Person object
    const newPerson: Person = {
      id: `ai-${Date.now()}`,
      name: suggestion.name,
      firstName: suggestion.name.split(' ')[0],
      lastName: suggestion.name.split(' ').slice(1).join(' '),
      gender: 'male',
      generation: selectedPerson ? selectedPerson.generation + (suggestion.relationshipType === 'child' ? 1 : -1) : 2,
      position: { x: 0, y: 0 },
      isAIMatched: true,
      matchConfidence: suggestion.confidence,
    };

    // Add the person through the family tree hook
    // This would integrate with the backend AI matching service
    Alert.alert('AI Suggestion Accepted', `${suggestion.name} has been added to your family tree.`);
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const renderConnectionLines = (generation: number) => {
    if (!familyTree) return null;
    
    const currentGenPeople = getPersonsByGeneration(generation);
    const nextGenPeople = getPersonsByGeneration(generation + 1);
    
    if (nextGenPeople.length === 0) return null;

    return (
      <View style={styles.connectionContainer}>
        {currentGenPeople.map((parent, parentIndex) => {
          const children = nextGenPeople.filter(child => 
            child.parents?.includes(parent.id)
          );
          
          if (children.length === 0) return null;
          
          return children.map((child, childIdx) => {
            // Calculate positions for n8n-style connections
            const totalParents = currentGenPeople.length;
            const totalChildren = nextGenPeople.length;
            
            const parentSectionWidth = width / totalParents;
            const childSectionWidth = width / totalChildren;
            
            const parentX = (parentIndex * parentSectionWidth) + (parentSectionWidth / 2);
            const childX = (nextGenPeople.indexOf(child) * childSectionWidth) + (childSectionWidth / 2);
            
            return (
              <View key={`${parent.id}-${child.id}`} style={styles.connectionWrapper}>
                {/* Vertical line from parent */}
                <View 
                  style={[
                    styles.parentLine,
                    { left: parentX - 1 }
                  ]} 
                />
                
                {/* Horizontal connecting line */}
                <View 
                  style={[
                    styles.connectingLine,
                    {
                      left: Math.min(parentX, childX),
                      width: Math.abs(childX - parentX) || 2,
                    }
                  ]} 
                />
                
                {/* Vertical line to child */}
                <View 
                  style={[
                    styles.childLine,
                    { left: childX - 1 }
                  ]} 
                />
                
                {/* Connection dots */}
                <View style={[styles.parentDot, { left: parentX - 4 }]} />
                <View style={[styles.childDot, { left: childX - 4 }]} />
              </View>
            );
          });
        })}
      </View>
    );
  };

  const renderGeneration = (generation: number) => {
    if (!familyTree) return null;
    
    const people = getPersonsByGeneration(generation);
    if (people.length === 0) return null;

    const generationNames = [
      'Great Grandparents', 
      'Grandparents', 
      'Parents', 
      'Your Generation', 
      'Children', 
      'Grandchildren'
    ];
    
    return (
      <View key={generation} style={styles.generationContainer}>
        <Text style={styles.generationTitle}>
          {generationNames[generation] || `Generation ${generation + 1}`}
        </Text>
        <View style={styles.generationRow}>
          {people.map(person => 
            <PersonNode 
              key={person.id}
              person={person} 
              onPress={() => handlePersonPress(person)}
            />
          )}
        </View>
        {renderConnectionLines(generation)}
      </View>
    );
  };

  // Generate background dots pattern like n8n
  const generateDots = () => {
    const dots = [];
    const dotsPerRow = Math.floor(width / 30);
    const dotsPerColumn = Math.floor((height * 2) / 30); // Extend for scrolling
    
    for (let i = 0; i < dotsPerColumn; i++) {
      for (let j = 0; j < dotsPerRow; j++) {
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[
              styles.dot,
              {
                top: i * 30,
                left: j * 30,
              }
            ]}
          />
        );
      }
    }
    return dots;
  };

  const stats = getTreeStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0091ad" />
      
      {/* Background Dots Pattern */}
      <View style={styles.dotsContainer}>
        {generateDots()}
      </View>
      
      {/* Header */}
      <LinearGradient
        colors={['#0091ad', '#04a7c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Family Tree</Text>
            {stats && (
              <Text style={styles.headerSubtitle}>
                {stats.totalMembers} members • {stats.generations} generations
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={() => setShowSyncModal(true)}
          >
            <Ionicons name="sync" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <AISuggestions
          suggestions={aiSuggestions}
          onAccept={handleAcceptSuggestion}
          onDismiss={handleDismissSuggestion}
        />
      )}

      {/* Family Tree - Interactive Pan & Zoom */}
      <View style={styles.treeViewport}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.treeScrollView}
          contentContainerStyle={styles.treeContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          maximumZoomScale={2}
          minimumZoomScale={0.5}
          zoomEnabled={true}
          scrollEnabled={true}
          directionalLockEnabled={false}
        >
          <View style={styles.treeContainer}>
            {/* Render all generations */}
            {Array.from({ length: 6 }, (_, i) => renderGeneration(i))}
            
            {/* Add Member Button */}
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={() => setShowAddChildModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#04a7c7" />
              <Text style={styles.addMemberText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity 
            style={styles.zoomButton}
            onPress={() => {
              // Zoom in functionality (will add logic)
              Alert.alert('Zoom', 'Pinch to zoom or use two fingers to pan around the tree');
            }}
          >
            <Ionicons name="add" size={16} color="#04a7c7" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.zoomButton}
            onPress={() => {
              // Zoom out functionality
              Alert.alert('Navigation', 'Use gestures to navigate: Pinch to zoom, drag to move');
            }}
          >
            <Ionicons name="remove" size={16} color="#04a7c7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <PersonDetailModal
        visible={showPersonModal}
        person={selectedPerson}
        onClose={() => setShowPersonModal(false)}
        onEdit={handleEditPress}
        onAddChild={handleAddChildPress}
      />

      <EditPersonModal
        visible={showEditModal}
        person={editingPerson}
        onClose={() => setShowEditModal(false)}
        onSave={saveEditedPerson}
      />

      <AddChildModal
        visible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAdd={(data) => {
          // Create new person from modal data and add to family tree
          if (selectedPerson) {
            const newPerson: Person = {
              id: `person_${Date.now()}`,
              name: `${data.firstName} ${data.lastName}`.trim(),
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: data.dateOfBirth || undefined,
              placeOfBirth: data.placeOfBirth || undefined,
              bio: data.bio || undefined,
              gender: data.gender,
              generation: selectedPerson.generation + 1,
              position: { x: 0, y: 0 },
              parents: [selectedPerson.id],
              children: [],
              siblings: [],
              isAIMatched: false,
            };
            
            // This would normally integrate with the backend
            Alert.alert('Success', `${newPerson.name} has been added to the family tree.`);
          }
          setShowAddChildModal(false);
        }}
        personData={{
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          placeOfBirth: '',
          gender: 'male' as 'male' | 'female',
          bio: ''
        }}
        onDataChange={() => {}}
      />

      <FamilyTreeSync
        visible={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        familyTree={familyTree}
        onSync={() => {
          Alert.alert('Sync Complete', 'Your family tree has been synchronized.');
          setShowSyncModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  dotsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  dot: {
    width: 2,
    height: 2,
    backgroundColor: '#94a3b8',
    borderRadius: 1,
    opacity: 0.3,
    position: 'absolute',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeViewport: {
    flex: 1,
    zIndex: 5,
    position: 'relative',
  },
  treeScrollView: {
    flex: 1,
  },
  treeContent: {
    paddingVertical: 20,
    minWidth: width * 1.2,
    minHeight: height * 1.5,
  },
  treeContainer: {
    minHeight: height * 1.5,
    position: 'relative',
    flex: 1,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 8,
    zIndex: 10,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  generationContainer: {
    marginVertical: 30,
    position: 'relative',
  },
  generationTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  generationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  connectionContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  connectionWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  parentLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 25,
    backgroundColor: '#64748b',
  },
  connectingLine: {
    position: 'absolute',
    top: 25,
    height: 2,
    backgroundColor: '#64748b',
  },
  childLine: {
    position: 'absolute',
    top: 25,
    width: 2,
    height: 35,
    backgroundColor: '#64748b',
  },
  parentDot: {
    position: 'absolute',
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#04a7c7',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  childDot: {
    position: 'absolute',
    top: 57,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#04a7c7',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 40,
    borderWidth: 2,
    borderColor: '#04a7c7',
    borderStyle: 'dashed',
  },
  addMemberText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#04a7c7',
    marginLeft: 8,
  },
});

export default TreeGenealogyScreen;