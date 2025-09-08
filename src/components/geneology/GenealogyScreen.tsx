// src/screens/main/GenealogyDashboard.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Person } from './Person';
import { PersonNode } from './PersonNode';
import { PersonDetailModal } from './PersonDetailModal';
import { EditPersonModal } from './EditPersonModal';
import { AddChildModal } from './AddChildModal';
import { useFamilyTree } from './useFamilyTree';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

interface GenealogyDashboardProps {
  navigation: any;
  route: any;
}

const GenealogyDashboard: React.FC<GenealogyDashboardProps> = ({ navigation, route }) => {
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
    getPersonsByGeneration
  } = useFamilyTree(user);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  const handlePersonPress = (person: Person) => {
    setSelectedPerson(person);
    setShowPersonModal(true);
  };

  const handleEditPress = (person: Person) => {
    setEditingPerson({ ...person });
    setShowPersonModal(false);
    setShowEditModal(true);
  };

  const renderConnectionLines = (generation: number) => {
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
            // Simple mobile-optimized positioning
            const totalParents = currentGenPeople.length;
            const totalChildren = nextGenPeople.length;
            
            // Calculate positions based on screen sections
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
                <View style={[styles.parentDot, { left: parentX - 3 }]} />
                <View style={[styles.childDot, { left: childX - 3 }]} />
              </View>
            );
          });
        })}
      </View>
    );
  };

  const renderGeneration = (generation: number) => {
    const people = getPersonsByGeneration(generation);
    if (people.length === 0) return null;

    const generationNames = [
      'Great Grandfather', 
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

  // Generate subtle dots pattern (reduced for mobile)
  const generateDots = () => {
    const dots = [];
    const dotsPerRow = Math.floor(width / 40);
    const dotsPerColumn = Math.floor(height / 40);
    
    for (let i = 0; i < dotsPerColumn; i++) {
      for (let j = 0; j < dotsPerRow; j++) {
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[
              styles.dot,
              {
                top: i * 40 + 10,
                left: j * 40 + 10,
                opacity: 0.05, // Much more subtle
              }
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0091ad" />
      
      {/* Background Dots */}
      <View style={styles.dotsContainer}>
        {generateDots()}
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#0091ad', '#04a7c7']}
          style={styles.headerGradient}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Family Tree</Text>
            <Text style={styles.headerSubtitle}>Al-Mansouri Family Heritage</Text>
          </View>
          
          <TouchableOpacity style={styles.aiButton}>
            <Ionicons name="sparkles" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Family Tree */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.treeContainer}
      >
        {[0, 1, 2, 3, 4, 5].map(generation => renderGeneration(generation))}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      <PersonDetailModal
        visible={showPersonModal}
        person={selectedPerson}
        onClose={() => setShowPersonModal(false)}
        onEdit={handleEditPress}
        onAddChild={() => {
          if (selectedPerson) {
            handleAddChild(selectedPerson.id);
            setShowAddChildModal(true);
          }
        }}
      />

      <EditPersonModal
        visible={showEditModal}
        person={editingPerson}
        onClose={() => setShowEditModal(false)}
        onSave={saveEditedPerson}
        onPersonChange={setEditingPerson}
      />

      <AddChildModal
        visible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAdd={(data) => {
          // Adapter function to convert AddChildModal data format to useFamilyTree format
          setNewPersonData({
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            placeOfBirth: data.placeOfBirth,
            gender: data.gender,
            bio: data.bio || '',
          });
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dotsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'relative',
    paddingTop: StatusBar.currentHeight || 40,
    zIndex: 10,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    zIndex: 5,
  },
  treeContainer: {
    padding: 20,
  },
  generationContainer: {
    marginBottom: 40,
  },
  generationTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  generationRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  connectionContainer: {
    height: 50,
    position: 'relative',
    width: '100%',
    marginVertical: 5,
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
    height: 15,
    backgroundColor: '#04a7c7',
  },
  connectingLine: {
    position: 'absolute',
    top: 14,
    height: 2,
    backgroundColor: '#04a7c7',
    minWidth: 2,
  },
  childLine: {
    position: 'absolute',
    top: 15,
    width: 2,
    height: 35,
    backgroundColor: '#04a7c7',
  },
  parentDot: {
    position: 'absolute',
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a7c7',
    borderWidth: 1,
    borderColor: '#000000',
  },
  childDot: {
    position: 'absolute',
    top: 46,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a7c7',
    borderWidth: 1,
    borderColor: '#000000',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default GenealogyDashboard;