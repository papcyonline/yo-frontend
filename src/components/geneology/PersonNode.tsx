// src/screens/main/components/PersonNode.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Person } from '../types/Person';
import { getSystemFont } from '../../config/constants';

interface PersonNodeProps {
  person: Person;
  onPress: () => void;
}

export const PersonNode: React.FC<PersonNodeProps> = ({ person, onPress }) => {
  const isCurrentUser = person.id === 'current_user';
  
  return (
    <TouchableOpacity
      style={[
        styles.personNode,
        isCurrentUser && styles.currentUserNode,
        !person.isAlive && styles.deceasedNode
      ]}
      onPress={onPress}
    >
      <View style={styles.personImageContainer}>
        {person.profileImage ? (
          <Image source={{ uri: person.profileImage }} style={styles.personImage} />
        ) : (
          <View style={[styles.personImagePlaceholder, !person.isAlive && styles.deceasedImagePlaceholder]}>
            <Text style={styles.personInitials}>
              {person.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        )}
        
        {person.isUser && (
          <View style={styles.userBadge}>
            <Ionicons name="person" size={12} color="#ffffff" />
          </View>
        )}
        
        {!person.isAlive && (
          <View style={styles.deceasedBadge}>
            <Ionicons name="rose" size={12} color="#ffffff" />
          </View>
        )}
      </View>
      
      <Text style={[styles.personName, !person.isAlive && styles.deceasedText]}>
        {person.name}
      </Text>
      <Text style={styles.personDates}>
        {person.birthDate ? new Date(person.birthDate).getFullYear() : '?'} - {' '}
        {person.isAlive ? 'Present' : (person.deathDate ? new Date(person.deathDate).getFullYear() : '?')}
      </Text>
      
      {person.children.length > 0 && (
        <View style={styles.childrenIndicator}>
          <Ionicons name="people" size={12} color="#0091ad" />
          <Text style={styles.childrenCount}>{person.children.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  personNode: {
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 90,
    maxWidth: 100,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currentUserNode: {
    borderWidth: 2,
    borderColor: '#04a7c7',
    backgroundColor: '#0a0f1a',
  },
  deceasedNode: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#404040',
  },
  personImageContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  personImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  personImagePlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deceasedImagePlaceholder: {
    backgroundColor: '#6b7280',
  },
  personInitials: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  userBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#04a7c7',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  deceasedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  personName: {
    fontSize: 11,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
    numberOfLines: 2,
    maxWidth: 85,
  },
  deceasedText: {
    color: '#9ca3af',
  },
  personDates: {
    fontSize: 9,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 3,
  },
  childrenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 199, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  childrenCount: {
    fontSize: 8,
    fontFamily: getSystemFont('semiBold'),
    color: '#04a7c7',
    marginLeft: 2,
  },
});