// src/components/geneology/useFamilyTree.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import genealogyService, { FamilyMember, FamilyTree, TreeStats } from '../../services/genealogyService';
import { Person } from './Person';

export const useFamilyTree = (user: any) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [familyTree, setFamilyTree] = useState<Record<string, Person>>({});
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newPersonData, setNewPersonData] = useState({
    name: '',
    birthDate: '',
    birthPlace: '',
    isAlive: true
  });

  // Initialize family tree data
  useEffect(() => {
    console.log('👤 FamilyTree - User data:', user ? 'Present' : 'Missing');
    if (user) {
      console.log('👤 FamilyTree - User ID:', user._id);
      initializeFamilyTree();
    }
  }, [user]);

  const initializeFamilyTree = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have authentication data - with detailed debugging
      console.log('🔍 Checking all AsyncStorage keys...');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📱 All stored keys:', allKeys);
      
      // Try the expected auth key (correct key with hyphens!)
      const authDataString = await AsyncStorage.getItem('yofam-auth-storage');
      console.log('🔑 yofam-auth-storage:', authDataString ? 'Present' : 'Missing');
      
      // Try alternative token keys that might be used
      const altToken1 = await AsyncStorage.getItem('yofam_auth_token');
      const altToken2 = await AsyncStorage.getItem('authToken');
      const altToken3 = await AsyncStorage.getItem('token');
      console.log('🔑 Alternative tokens:', {
        yofam_auth_token: altToken1 ? 'Present' : 'Missing',
        authToken: altToken2 ? 'Present' : 'Missing', 
        token: altToken3 ? 'Present' : 'Missing'
      });
      
      if (!authDataString) {
        throw new Error('Please log in to access family tree features');
      }
      
      const authData = JSON.parse(authDataString);
      console.log('🔒 Auth data structure:', Object.keys(authData));
      console.log('🔒 State structure:', authData.state ? Object.keys(authData.state) : 'No state');
      console.log('🔒 Has token:', !!(authData.token || authData.state?.token));
      console.log('🔒 Is authenticated:', authData.isAuthenticated || authData.state?.isAuthenticated);
      
      const token = authData.token || authData.state?.token;
      const isAuthenticated = authData.isAuthenticated || authData.state?.isAuthenticated;
      
      if (!token || !isAuthenticated) {
        throw new Error('Please log in to access family tree features');
      }

      console.log('🌳 FamilyTree - Initializing with user:', user._id);

      // First, get user's family trees
      const trees = await genealogyService.getFamilyTrees();
      let activeTreeId: string;

      if (trees.length === 0) {
        // Create a default family tree for new users
        const newTree = await genealogyService.createDefaultFamilyTree(user._id, user.name);
        activeTreeId = newTree._id!;

        // Create user as the first family member
        await genealogyService.createUserAsFamilyMember(activeTreeId, user, {
          generation: 0,
          bio: 'This is me! The start of documenting my family heritage.',
        });
      } else {
        // Use the first tree (or get from user preferences)
        activeTreeId = trees[0]._id!;
      }

      setCurrentTreeId(activeTreeId);

      // Load family members
      await loadFamilyMembers(activeTreeId);

    } catch (error) {
      console.error('Error initializing family tree:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load family tree';
      setError(errorMessage);
      
      if (errorMessage.includes('Authentication failed')) {
        Alert.alert('Authentication Required', 'Please log in again to access your family tree.');
      } else if (errorMessage.includes('Please log in')) {
        Alert.alert('Login Required', 'Please log in to access family tree features.');
      } else {
        Alert.alert('Error', 'Failed to load your family tree. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (treeId: string) => {
    try {
      const members = await genealogyService.getFamilyMembers(treeId);
      
      // Convert to the format expected by the frontend
      const membersMap: Record<string, Person> = {};
      
      members.forEach(member => {
        membersMap[member._id || member.firstName] = convertToPersonFormat(member);
      });

      setFamilyTree(membersMap);
    } catch (error) {
      console.error('Error loading family members:', error);
      throw error;
    }
  };

  const convertToPersonFormat = (member: FamilyMember): Person => {
    // Helper function to convert ObjectIds or refs to string IDs
    const convertToStringArray = (refs: any[]): string[] => {
      if (!Array.isArray(refs)) return [];
      return refs.map(ref => {
        if (typeof ref === 'string') return ref;
        if (ref && typeof ref === 'object' && ref._id) return ref._id.toString();
        if (ref && typeof ref === 'object' && ref.toString) return ref.toString();
        return String(ref);
      }).filter(id => id && id !== 'undefined');
    };

    const convertToString = (ref: any): string | undefined => {
      if (!ref) return undefined;
      if (typeof ref === 'string') return ref;
      if (ref && typeof ref === 'object' && ref._id) return ref._id.toString();
      if (ref && typeof ref === 'object' && ref.toString) return ref.toString();
      return String(ref);
    };

    console.log(`🔄 Converting member ${member.name}:`, {
      children: member.children,
      parents: member.parents,
      siblings: member.siblings,
      spouse: member.spouse
    });

    return {
      id: member._id || member.firstName,
      name: member.name,
      firstName: member.firstName,
      lastName: member.lastName,
      birthDate: member.dateOfBirth,
      dateOfBirth: member.dateOfBirth,
      deathDate: member.dateOfDeath,
      dateOfDeath: member.dateOfDeath,
      birthPlace: member.placeOfBirth,
      placeOfBirth: member.placeOfBirth,
      burialPlace: member.burialPlace,
      isAlive: member.isAlive,
      currentLocation: member.currentLocation,
      photo: member.photo,
      children: convertToStringArray(member.children || []),
      parents: convertToStringArray(member.parents || []),
      siblings: convertToStringArray(member.siblings || []),
      spouse: convertToString(member.spouse),
      generation: member.generation,
      bio: member.bio,
      profession: member.profession,
      achievements: member.achievements || [],
      photos: member.photos || [],
      gender: member.gender,
      isUser: member.isCurrentUser,
      isCurrentUser: member.isCurrentUser,
      isEditable: member.isEditable !== false,
      isAIMatched: member.isAIMatched,
      matchConfidence: member.matchConfidence,
    };
  };

  const convertFromPersonFormat = (person: Person): Partial<FamilyMember> => {
    return {
      firstName: person.firstName,
      lastName: person.lastName,
      name: person.name,
      gender: person.gender,
      dateOfBirth: person.dateOfBirth || person.birthDate,
      placeOfBirth: person.placeOfBirth || person.birthPlace,
      dateOfDeath: person.dateOfDeath || person.deathDate,
      burialPlace: person.burialPlace,
      isAlive: person.isAlive,
      currentLocation: person.currentLocation,
      photo: person.photo,
      bio: person.bio,
      profession: person.profession,
      achievements: person.achievements || [],
      photos: person.photos || [],
      generation: person.generation,
      parents: person.parents || [],
      children: person.children || [],
      siblings: person.siblings || [],
      spouse: person.spouse,
      familyTreeId: currentTreeId!,
      userId: user._id,
    };
  };

  const getPersonsByGeneration = (generation: number): Person[] => {
    return Object.values(familyTree).filter(person => person.generation === generation);
  };

  const handleAddChild = (parentId: string) => {
    setNewPersonData({
      name: '',
      birthDate: '',
      birthPlace: '',
      isAlive: true
    });
    setSelectedPerson(familyTree[parentId]);
  };

  const saveEditedPerson = async () => {
    if (!editingPerson || !currentTreeId) {
      Alert.alert('Error', 'No person selected for editing');
      return;
    }

    try {
      setLoading(true);
      
      const memberData = convertFromPersonFormat(editingPerson);
      
      if (editingPerson.id && editingPerson.id !== editingPerson.firstName) {
        // Update existing member
        const updatedMember = await genealogyService.updateFamilyMember(editingPerson.id, memberData);
        
        // Update local state
        const updatedPerson = convertToPersonFormat(updatedMember);
        setFamilyTree(prev => ({
          ...prev,
          [editingPerson.id]: updatedPerson
        }));
      } else {
        // Create new member
        const newMember = await genealogyService.createFamilyMember(currentTreeId, memberData);
        
        // Update local state
        const newPerson = convertToPersonFormat(newMember);
        setFamilyTree(prev => ({
          ...prev,
          [newMember._id!]: newPerson
        }));
      }

      setEditingPerson(null);
      Alert.alert('Success', 'Profile updated successfully!');
      
    } catch (error) {
      console.error('Error saving person:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addNewChild = async () => {
    if (!newPersonData.name.trim() || !selectedPerson || !currentTreeId) {
      Alert.alert('Error', 'Name is required and parent must be selected');
      return;
    }

    try {
      setLoading(true);

      const [firstName, ...lastNameParts] = newPersonData.name.trim().split(' ');
      const lastName = lastNameParts.join(' ') || selectedPerson.lastName;

      const childData: Partial<FamilyMember> = {
        firstName,
        lastName,
        name: newPersonData.name.trim(),
        gender: 'male', // Default, can be changed later
        placeOfBirth: newPersonData.birthPlace,
        dateOfBirth: newPersonData.birthDate,
        isAlive: newPersonData.isAlive,
        generation: selectedPerson.generation + 1,
        parents: [selectedPerson.id],
        familyTreeId: currentTreeId,
        userId: user._id,
        bio: 'Recently added family member.',
      };

      const newMember = await genealogyService.createFamilyMember(currentTreeId, childData);
      
      // Update local state
      const newPerson = convertToPersonFormat(newMember);
      
      setFamilyTree(prev => ({
        ...prev,
        [newMember._id!]: newPerson,
        [selectedPerson.id]: {
          ...prev[selectedPerson.id],
          children: [...(prev[selectedPerson.id].children || []), newMember._id!]
        }
      }));

      Alert.alert('Success', 'New family member added!');
      
      // Reset form
      setNewPersonData({
        name: '',
        birthDate: '',
        birthPlace: '',
        isAlive: true
      });
      
    } catch (error) {
      console.error('Error adding child:', error);
      Alert.alert('Error', 'Failed to add family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // New function to handle AddChildModal data format
  const addFamilyMemberFromModal = async (data: {
    firstName: string;
    lastName: string;
    yearOfBirth: string;
    placeOfBirth: string;
    gender: 'male' | 'female';
    bio?: string;
    profilePhoto?: string;
    galleryImages?: string[];
  }, parentPerson?: Person) => {
    if (!data.firstName.trim() || !currentTreeId) {
      Alert.alert('Error', 'First name is required');
      return false;
    }

    try {
      setLoading(true);

      const memberData: Partial<FamilyMember> = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim() || (parentPerson?.lastName || ''),
        name: `${data.firstName.trim()} ${data.lastName.trim() || (parentPerson?.lastName || '')}`.trim(),
        gender: data.gender,
        placeOfBirth: data.placeOfBirth.trim() || undefined,
        dateOfBirth: data.yearOfBirth ? new Date(`${data.yearOfBirth}-01-01`).toISOString() : undefined,
        isAlive: true, // Default to alive
        generation: parentPerson ? parentPerson.generation + 1 : 0,
        // Only include parents array if we have a parent, otherwise omit it
        ...(parentPerson ? { parents: [parentPerson.id] } : {}),
        familyTreeId: currentTreeId,
        userId: user._id,
        bio: data.bio?.trim() || undefined,
      };

      const newMember = await genealogyService.createFamilyMember(
        currentTreeId, 
        memberData,
        data.profilePhoto,
        data.galleryImages
      );
      
      // Update local state
      const newPerson = convertToPersonFormat(newMember);
      
      setFamilyTree(prev => {
        const updated = {
          ...prev,
          [newMember._id!]: newPerson
        };

        // Update parent's children if there's a parent
        if (parentPerson) {
          updated[parentPerson.id] = {
            ...prev[parentPerson.id],
            children: [...(prev[parentPerson.id].children || []), newMember._id!]
          };
        }

        return updated;
      });

      Alert.alert('Success', `${data.firstName} has been added to the family tree!`);
      return true;
      
    } catch (error) {
      console.error('Error adding family member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add family member. Please try again.';
      
      if (errorMessage.includes('session has expired') || errorMessage.includes('log in again')) {
        Alert.alert(
          'Session Expired', 
          'Your login session has expired. Please log in again to continue adding family members.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFamilyMember = async (memberId: string) => {
    if (!memberId || memberId === user._id) {
      Alert.alert('Error', 'Cannot delete this family member');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this family member? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await genealogyService.deleteFamilyMember(memberId);
              
              // Remove from local state
              setFamilyTree(prev => {
                const updated = { ...prev };
                delete updated[memberId];
                
                // Remove references from other members
                Object.keys(updated).forEach(key => {
                  const member = updated[key];
                  if (member.children?.includes(memberId)) {
                    member.children = member.children.filter(id => id !== memberId);
                  }
                  if (member.parents?.includes(memberId)) {
                    member.parents = member.parents.filter(id => id !== memberId);
                  }
                  if (member.siblings?.includes(memberId)) {
                    member.siblings = member.siblings.filter(id => id !== memberId);
                  }
                  if (member.spouse === memberId) {
                    member.spouse = undefined;
                  }
                });
                
                return updated;
              });

              Alert.alert('Success', 'Family member deleted successfully');
              
            } catch (error) {
              console.error('Error deleting family member:', error);
              Alert.alert('Error', 'Failed to delete family member. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Get tree statistics
  const getTreeStats = async (): Promise<TreeStats | null> => {
    if (!currentTreeId) return null;

    try {
      const stats = await genealogyService.getTreeStats(currentTreeId);
      return stats;
    } catch (error) {
      console.error('Error fetching tree stats:', error);
      
      // Fallback to local calculation
      const members = Object.values(familyTree);
      if (members.length === 0) return null;

      const generations = Math.max(...members.map(m => m.generation)) - Math.min(...members.map(m => m.generation)) + 1;
      const aiMatched = members.filter(m => m.isAIMatched).length;
      const withPhotos = members.filter(m => m.photo).length;
      const withBios = members.filter(m => m.bio).length;

      return {
        totalMembers: members.length,
        generations,
        aiMatched,
        withPhotos,
        withBios,
        completeness: Math.round((withBios + withPhotos) / (members.length * 2) * 100),
      };
    }
  };

  // Refresh data from server
  const refreshFamilyTree = async () => {
    if (currentTreeId) {
      try {
        setLoading(true);
        await loadFamilyMembers(currentTreeId);
      } catch (error) {
        console.error('Error refreshing family tree:', error);
        Alert.alert('Error', 'Failed to refresh data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    familyTree,
    selectedPerson,
    setSelectedPerson,
    editingPerson,
    setEditingPerson,
    newPersonData,
    setNewPersonData,
    saveEditedPerson,
    addNewChild,
    addFamilyMemberFromModal,
    handleAddChild,
    getPersonsByGeneration,
    getTreeStats,
    deleteFamilyMember,
    refreshFamilyTree,
    loading,
    error,
    currentTreeId,
  };
};