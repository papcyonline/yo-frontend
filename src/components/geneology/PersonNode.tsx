// src/screens/main/components/PersonNode.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Person } from './Person';
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
        {person.photo ? (
          <Image source={{ uri: person.photo }} style={styles.personImage} />
        ) : (
          <View style={[styles.personImagePlaceholder, !person.isAlive && styles.deceasedImagePlaceholder]}>
            <Text style={styles.personInitials}>
              {person.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        )}
        
        {person.isCurrentUser && (
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
        {person.dateOfBirth ? new Date(person.dateOfBirth).getFullYear() : '?'} - {' '}
        {person.isAlive ? 'Present' : (person.dateOfDeath ? new Date(person.dateOfDeath).getFullYear() : '?')}
      </Text>
      
      {person.children && person.children.length > 0 && (
        <View style={styles.childrenIndicator}>
          <Ionicons name="people" size={12} color="#0091ad" />
          <Text style={styles.childrenCount}>{person.children?.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  personNode: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
    maxWidth: 120,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  currentUserNode: {
    borderWidth: 2,
    borderColor: '#04a7c7',
    backgroundColor: '#f0f9ff',
  },
  deceasedNode: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#94a3b8',
    opacity: 0.8,
  },
  personImageContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  personImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  personImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#04a7c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  deceasedImagePlaceholder: {
    backgroundColor: '#6b7280',
  },
  personInitials: {
    fontSize: 18,
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
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
    maxWidth: 95,
  },
  deceasedText: {
    color: '#64748b',
  },
  personDates: {
    fontSize: 10,
    fontFamily: getSystemFont('regular'),
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 6,
  },
  childrenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#04a7c7',
  },
  childrenCount: {
    fontSize: 8,
    fontFamily: getSystemFont('semiBold'),
    color: '#04a7c7',
    marginLeft: 2,
  },
});