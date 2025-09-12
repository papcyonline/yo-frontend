import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { usersApi } from '../../services/api/users';
import { communityAPI } from '../../services/api/communities';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface AddMembersScreenProps {
  navigation: any;
  route: any;
}

const AddMembersScreen: React.FC<AddMembersScreenProps> = ({ navigation, route }) => {
  const { communityId, communityName, existingMembers = [] } = route.params;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertConfig, setCustomAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{text: string, onPress: () => void, style?: 'default' | 'destructive'}>
  });

  // Custom Alert Function
  const showCustomAlertDialog = (title: string, message: string, buttons: Array<{text: string, onPress: () => void, style?: 'default' | 'destructive'}>) => {
    setCustomAlertConfig({ title, message, buttons });
    setShowCustomAlert(true);
  };

  // Get existing member IDs to filter them out from search results
  const existingMemberIds = new Set(existingMembers.map((member: any) => member.id));

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await usersApi.searchUsers(query);
      if (response.success) {
        // Filter out existing members
        const filteredUsers = response.data.users.filter(user => 
          !existingMemberIds.has(user._id || user.id)
        );
        
        // Transform users to match our interface
        const transformedUsers: User[] = filteredUsers.map(user => ({
          id: user._id || user.id,
          fullName: user.fullName || `${user.firstName} ${user.lastName}`,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          profilePicture: user.profilePicture || user.avatar,
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || 'Recently'
        }));
        
        setSearchResults(transformedUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      showCustomAlertDialog(
        'Error',
        'Failed to search users. Please try again.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    searchUsers(text);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const addSelectedMembers = async () => {
    if (selectedUsers.size === 0) {
      showCustomAlertDialog(
        'No Selection',
        'Please select at least one user to add to the community.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
      return;
    }

    const selectedUsersData = searchResults.filter(user => selectedUsers.has(user.id));
    const memberNames = selectedUsersData.map(user => user.fullName).join(', ');
    
    showCustomAlertDialog(
      'Add Members',
      `Add ${selectedUsers.size} member${selectedUsers.size > 1 ? 's' : ''} (${memberNames}) to ${communityName}?`,
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { 
          text: 'Add', 
          onPress: async () => {
            setShowCustomAlert(false);
            setLoading(true);
            
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                showCustomAlertDialog(
                  'Error',
                  'Authentication required. Please log in again.',
                  [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
                );
                return;
              }

              const userIds = Array.from(selectedUsers);
              const response = await communityAPI.addMembers(token, communityId, userIds);

              if (response.success) {
                showCustomAlertDialog(
                  'Success',
                  response.message || `${selectedUsers.size} member${selectedUsers.size > 1 ? 's' : ''} added to ${communityName} successfully!`,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      setShowCustomAlert(false);
                      navigation.goBack();
                    }
                  }]
                );
              } else {
                showCustomAlertDialog(
                  'Error',
                  response.message || 'Failed to add members. Please try again.',
                  [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
                );
              }
            } catch (error: any) {
              console.error('Error adding members:', error);
              showCustomAlertDialog(
                'Error',
                error.message || 'Failed to add members. Please try again.',
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.id)}
      >
        <View style={styles.userAvatar}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {item.firstName[0]}{item.lastName[0]}
              </Text>
            </LinearGradient>
          )}
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userStatus}>{item.lastSeen}</Text>
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#04a7c7" />
          <Text style={styles.emptyStateText}>Searching users...</Text>
        </View>
      );
    }

    if (searchQuery.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color="#666666" />
          <Text style={styles.emptyStateTitle}>Search for Users</Text>
          <Text style={styles.emptyStateText}>
            Start typing to find users you want to add to your community
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery.length >= 2) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="person-remove" size={64} color="#666666" />
          <Text style={styles.emptyStateTitle}>No Users Found</Text>
          <Text style={styles.emptyStateText}>
            Try different search terms or check the spelling
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Add Members</Text>
          <Text style={styles.headerSubtitle}>
            {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : communityName}
          </Text>
        </View>
        {selectedUsers.size > 0 && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addSelectedMembers}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected Users Count */}
      {selectedUsers.size > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {/* Users List */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>{customAlertConfig.title}</Text>
            <Text style={styles.alertMessage}>{customAlertConfig.message}</Text>
            
            <View style={styles.alertButtonContainer}>
              {customAlertConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    button.style === 'destructive' && styles.alertButtonDestructive,
                    index === customAlertConfig.buttons.length - 1 && styles.alertButtonLast
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.alertButtonText,
                    button.style === 'destructive' && styles.alertButtonTextDestructive
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semibold'),
    color: '#fcd3aa',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#04a7c7',
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semibold'),
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    marginLeft: 10,
  },
  selectedCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
  },
  selectedCountText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#04a7c7',
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: getSystemFont('semibold'),
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000000',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  userStatus: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#04a7c7',
    borderColor: '#04a7c7',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semibold'),
    color: '#cccccc',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  // Custom Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alertContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#333333',
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semibold'),
    color: '#fcd3aa',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  alertButtonContainer: {
    flexDirection: 'row',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#333333',
    borderRadius: 8,
    marginRight: 12,
  },
  alertButtonLast: {
    marginRight: 0,
  },
  alertButtonDestructive: {
    backgroundColor: '#dc3545',
  },
  alertButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    textAlign: 'center',
  },
  alertButtonTextDestructive: {
    color: '#ffffff',
  },
});

export default AddMembersScreen;