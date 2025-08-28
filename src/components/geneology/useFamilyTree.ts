// src/screens/main/hooks/useFamilyTree.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { Person } from './Person';

export const useFamilyTree = (user: any) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [newPersonData, setNewPersonData] = useState({
    name: '',
    birthDate: '',
    birthPlace: '',
    isAlive: true
  });

  // Sample family tree data
  const [familyTree, setFamilyTree] = useState<Record<string, Person>>({
    'great_grandfather': {
      id: 'great_grandfather',
      name: 'Ahmed Al-Mansouri',
      birthDate: '1920-03-15',
      deathDate: '1995-11-22',
      birthPlace: 'Dubai, UAE',
      burialPlace: 'Al-Qusais Cemetery, Dubai',
      isAlive: false,
      profileImage: 'https://picsum.photos/200/200?random=1',
      children: ['grandfather1', 'grandfather2'],
      generation: 0,
      bio: 'Pearl diver and trader who established the family business in Dubai.',
      profession: 'Pearl Trader',
      achievements: ['Founded Al-Mansouri Trading Company', 'Community Leader'],
      photos: ['https://picsum.photos/300/200?random=10', 'https://picsum.photos/300/200?random=11']
    },
    'grandfather1': {
      id: 'grandfather1',
      name: 'Mohammed Al-Mansouri',
      birthDate: '1945-07-10',
      deathDate: '2010-05-18',
      birthPlace: 'Dubai, UAE',
      burialPlace: 'Al-Qusais Cemetery, Dubai',
      isAlive: false,
      profileImage: 'https://picsum.photos/200/200?random=2',
      children: ['father1', 'uncle1'],
      parents: ['great_grandfather'],
      generation: 1,
      bio: 'Expanded the family business into real estate.',
      profession: 'Real Estate Developer'
    },
    'grandfather2': {
      id: 'grandfather2',
      name: 'Ali Al-Mansouri',
      birthDate: '1948-12-03',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Abu Dhabi, UAE',
      isAlive: true,
      profileImage: 'https://picsum.photos/200/200?random=3',
      children: ['father2'],
      parents: ['great_grandfather'],
      generation: 1,
      bio: 'Retired government official, still active in community work.',
      profession: 'Government Official (Retired)'
    },
    'father1': {
      id: 'father1',
      name: 'Omar Al-Mansouri',
      birthDate: '1975-09-20',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Dubai, UAE',
      isAlive: true,
      profileImage: 'https://picsum.photos/200/200?random=4',
      children: ['current_user', 'sibling1'],
      parents: ['grandfather1'],
      generation: 2,
      isUser: true,
      bio: 'Tech entrepreneur, following family tradition of innovation.',
      profession: 'Software Engineer',
      isEditable: false
    },
    'father2': {
      id: 'father2',
      name: 'Khalid Al-Mansouri',
      birthDate: '1978-04-15',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Sharjah, UAE',
      isAlive: true,
      profileImage: 'https://picsum.photos/200/200?random=5',
      children: ['cousin1'],
      parents: ['grandfather2'],
      generation: 2,
      bio: 'Doctor specializing in cardiology.',
      profession: 'Cardiologist'
    },
    'uncle1': {
      id: 'uncle1',
      name: 'Hassan Al-Mansouri',
      birthDate: '1970-01-25',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Dubai, UAE',
      isAlive: true,
      children: ['cousin2', 'cousin3'],
      parents: ['grandfather1'],
      generation: 2,
      bio: 'Artist and cultural preservationist.',
      profession: 'Artist'
    },
    'current_user': {
      id: 'current_user',
      name: user?.name || 'You',
      birthDate: '2000-06-12',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Dubai, UAE',
      isAlive: true,
      profileImage: user?.profileImage,
      children: [],
      parents: ['father1'],
      generation: 3,
      isUser: true,
      bio: 'Young professional passionate about preserving family history.',
      profession: 'Student/Professional',
      isEditable: true
    },
    'sibling1': {
      id: 'sibling1',
      name: 'Fatima Al-Mansouri',
      birthDate: '1998-11-30',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Dubai, UAE',
      isAlive: true,
      children: [],
      parents: ['father1'],
      generation: 3,
      bio: 'Medical student with interest in family heritage.',
      profession: 'Medical Student'
    },
    'cousin1': {
      id: 'cousin1',
      name: 'Sara Al-Mansouri',
      birthDate: '2002-08-18',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Sharjah, UAE',
      isAlive: true,
      children: [],
      parents: ['father2'],
      generation: 3,
      bio: 'Engineering student.',
      profession: 'Engineering Student'
    },
    'cousin2': {
      id: 'cousin2',
      name: 'Abdullah Al-Mansouri',
      birthDate: '1995-03-22',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Dubai, UAE',
      isAlive: true,
      children: [],
      parents: ['uncle1'],
      generation: 3,
      bio: 'Graphic designer and digital artist.',
      profession: 'Graphic Designer'
    },
    'cousin3': {
      id: 'cousin3',
      name: 'Aisha Al-Mansouri',
      birthDate: '1997-12-05',
      birthPlace: 'Dubai, UAE',
      currentLocation: 'Dubai, UAE',
      isAlive: true,
      children: [],
      parents: ['uncle1'],
      generation: 3,
      bio: 'Teacher passionate about education.',
      profession: 'Teacher'
    }
  });

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

  const saveEditedPerson = () => {
    if (editingPerson) {
      setFamilyTree(prev => ({
        ...prev,
        [editingPerson.id]: editingPerson
      }));
      setEditingPerson(null);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const addNewChild = () => {
    if (!newPersonData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const newChildId = `child_${Date.now()}`;
    const newChild: Person = {
      id: newChildId,
      name: newPersonData.name,
      birthDate: newPersonData.birthDate,
      birthPlace: newPersonData.birthPlace,
      isAlive: newPersonData.isAlive,
      currentLocation: newPersonData.birthPlace,
      children: [],
      parents: [selectedPerson!.id],
      generation: selectedPerson!.generation + 1,
      bio: 'Recently added family member.',
      isEditable: false
    };

    setFamilyTree(prev => ({
      ...prev,
      [newChildId]: newChild,
      [selectedPerson!.id]: {
        ...prev[selectedPerson!.id],
        children: [...prev[selectedPerson!.id].children, newChildId]
      }
    }));

    Alert.alert('Success', 'New family member added!');
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
    handleAddChild,
    getPersonsByGeneration
  };
};