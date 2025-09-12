import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSystemFont } from '../../config/constants';
import { communityAPI } from '../../services/api/communities';

const { width, height } = Dimensions.get('window');

interface CommunityInfoScreenProps {
  navigation: any;
  route: any;
}

interface CommunityMember {
  id: string;
  name: string;
  profileImage?: string;
  role: 'creator' | 'admin' | 'member';
  isOnline: boolean;
  lastSeen: string;
  joinedDate?: string;
}

const CommunityInfoScreen: React.FC<CommunityInfoScreenProps> = ({ navigation, route }) => {
  const { community } = route.params;
  const [isAdmin, setIsAdmin] = useState(community?.userRole === 'creator' || community?.userRole === 'admin');
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
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [communityInfo, setCommunityInfo] = useState({
    name: community?.name || 'Community Name',
    description: community?.description || 'This is a great community for sharing and connecting with like-minded people.',
    memberCount: community?.memberCount || 0,
    createdDate: '2024-01-15',
    category: community?.category || 'General',
    isPrivate: community?.isPrivate || false,
    profileImage: null as string | null
  });

  // Fetch community members on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        if (!token || !community?.id) {
          setLoading(false);
          return;
        }

        const response = await communityAPI.getMembers(token, community.id);
        if (response.success && response.data?.members) {
          setMembers(response.data.members);
          setCommunityInfo(prev => ({
            ...prev,
            memberCount: response.data.members.length
          }));
        }
      } catch (error) {
        console.error('Error fetching community members:', error);
        showCustomAlertDialog(
          'Error',
          'Failed to load community members. Please try again.',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [community?.id]);

  const changeProfileImage = async () => {
    showCustomAlertDialog(
      'Change Community Photo',
      'Select a new photo for the community',
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { text: 'Camera', onPress: () => { setShowCustomAlert(false); takePicture(); } },
        { text: 'Gallery', onPress: () => { setShowCustomAlert(false); pickImage(); } }
      ]
    );
  };

  const takePicture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showCustomAlertDialog(
          'Permission Needed',
          'Camera access is required to take photos',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCommunityInfo(prev => ({...prev, profileImage: result.assets[0].uri}));
        showCustomAlertDialog(
          'Photo Updated',
          'Community profile photo has been updated successfully!',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      showCustomAlertDialog(
        'Camera Error',
        'Failed to take photo. Please try again.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showCustomAlertDialog(
          'Permission Needed',
          'Photo library access is required to select photos',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCommunityInfo(prev => ({...prev, profileImage: result.assets[0].uri}));
        showCustomAlertDialog(
          'Photo Updated',
          'Community profile photo has been updated successfully!',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showCustomAlertDialog(
        'Gallery Error',
        'Failed to select photo. Please try again.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    }
  };

  const editCommunityInfo = () => {
    // Navigate to edit screen or show edit modal
    showCustomAlertDialog(
      'Edit Info',
      'Edit community information feature coming soon',
      [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
    );
  };

  const addMembers = () => {
    // Navigate to add members screen
    navigation.navigate('AddMembers', {
      communityId: communityInfo.id,
      communityName: communityInfo.name,
      existingMembers: members
    });
  };

  const viewAllMembers = () => {
    navigation.navigate('CommunityMembers', { 
      members, 
      communityName: communityInfo.name,
      isAdmin 
    });
  };

  const handleMemberPress = (member: CommunityMember) => {
    if (isAdmin && member.role !== 'creator') {
      const actions = [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { text: 'View Profile', onPress: () => { setShowCustomAlert(false); viewMemberProfile(member); } },
        { text: 'Message', onPress: () => { setShowCustomAlert(false); messageMember(member); } }
      ];
      
      if (member.role === 'member') {
        actions.push({ text: 'Make Admin', onPress: () => { setShowCustomAlert(false); makeAdmin(member); } });
      }
      
      actions.push({ text: 'Remove', onPress: () => { setShowCustomAlert(false); removeMember(member); }, style: 'destructive' });
      
      showCustomAlertDialog(
        member.name,
        'What would you like to do?',
        actions
      );
    } else {
      messageMember(member);
    }
  };

  const viewMemberProfile = (member: CommunityMember) => {
    showCustomAlertDialog(
      'Profile',
      `View ${member.name}'s profile`,
      [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
    );
  };

  const messageMember = (member: CommunityMember) => {
    navigation.navigate('ChatScreen', {
      match: {
        id: member.id,
        name: member.name,
        type: 'personal'
      }
    });
  };

  const makeAdmin = (member: CommunityMember) => {
    showCustomAlertDialog(
      'Make Admin',
      `Make ${member.name} a community admin?`,
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { 
          text: 'Make Admin', 
          onPress: () => {
            setMembers(prev => 
              prev.map(m => m.id === member.id ? {...m, role: 'admin'} : m)
            );
            setShowCustomAlert(false);
            setTimeout(() => {
              showCustomAlertDialog(
                'Success',
                `${member.name} is now an admin`,
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
            }, 300);
          }
        }
      ]
    );
  };

  const removeMember = (member: CommunityMember) => {
    showCustomAlertDialog(
      'Remove Member',
      `Remove ${member.name} from the community?`,
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setMembers(prev => prev.filter(m => m.id !== member.id));
            setCommunityInfo(prev => ({...prev, memberCount: prev.memberCount - 1}));
            setShowCustomAlert(false);
            setTimeout(() => {
              showCustomAlertDialog(
                'Removed',
                `${member.name} has been removed`,
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
            }, 300);
          }
        }
      ]
    );
  };

  const renderMember = ({ item }: { item: CommunityMember }) => (
    <TouchableOpacity 
      style={styles.memberItem}
      onPress={() => handleMemberPress(item)}
    >
      <View style={styles.memberAvatar}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={['#0091ad', '#04a7c7']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </LinearGradient>
        )}
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.name}</Text>
          {item.role === 'creator' && (
            <Text style={styles.roleLabel}>Creator</Text>
          )}
          {item.role === 'admin' && (
            <Text style={[styles.roleLabel, styles.adminLabel]}>Admin</Text>
          )}
        </View>
        <Text style={styles.memberStatus}>{item.lastSeen}</Text>
      </View>
      
      {isAdmin && item.role !== 'creator' && (
        <Ionicons name="chevron-forward" size={20} color="#666666" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Info</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Community Profile Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={isAdmin ? changeProfileImage : undefined}
        >
          {communityInfo.profileImage ? (
            <Image source={{ uri: communityInfo.profileImage }} style={styles.profileImage} />
          ) : (
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.profileImage}
            >
              <Ionicons name="people" size={60} color="#ffffff" />
            </LinearGradient>
          )}
          {isAdmin && (
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.communityDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.communityName}>{communityInfo.name}</Text>
            {isAdmin && (
              <TouchableOpacity onPress={editCommunityInfo}>
                <Ionicons name="create-outline" size={20} color="#04a7c7" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.memberCount}>
            {communityInfo.memberCount} members • {communityInfo.category}
          </Text>
          <Text style={styles.createdDate}>
            Created on {new Date(communityInfo.createdDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{communityInfo.description}</Text>
      </View>

      {/* Members Section */}
      <View style={styles.membersSection}>
        <View style={styles.membersHeader}>
          <Text style={styles.sectionTitle}>Members ({communityInfo.memberCount})</Text>
          <TouchableOpacity onPress={viewAllMembers}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {isAdmin && (
          <TouchableOpacity style={styles.addMemberButton} onPress={addMembers}>
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.addMemberGradient}
            >
              <Ionicons name="person-add" size={20} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.addMemberText}>Add Members</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#04a7c7" />
            <Text style={styles.loadingText}>Loading members...</Text>
          </View>
        ) : (
          <FlatList
            data={members.slice(0, 5)} // Show first 5 members
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Community Settings */}
      {isAdmin && (
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Community Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="lock-closed-outline" size={20} color="#04a7c7" />
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#04a7c7" />
            <Text style={styles.settingText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-outline" size={20} color="#04a7c7" />
            <Text style={styles.settingText}>Community Rules</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="notifications-off-outline" size={20} color="#ff6b6b" />
          <Text style={styles.actionText}>Mute Community</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.dangerAction]}>
          <Ionicons name="exit-outline" size={20} color="#ff6b6b" />
          <Text style={[styles.actionText, styles.dangerText]}>Leave Community</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <TouchableOpacity style={[styles.actionButton, styles.dangerAction]}>
            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
            <Text style={[styles.actionText, styles.dangerText]}>Delete Community</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customAlert}>
            <Text style={styles.alertTitle}>{customAlertConfig.title}</Text>
            {customAlertConfig.message ? (
              <Text style={styles.alertMessage}>{customAlertConfig.message}</Text>
            ) : null}
            
            <View style={styles.alertButtons}>
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
    </ScrollView>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semibold'),
    color: '#fcd3aa',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#1a1a1a',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#04a7c7',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityDetails: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communityName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginRight: 10,
  },
  memberCount: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
  },
  descriptionSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semibold'),
    color: '#fcd3aa',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    lineHeight: 22,
  },
  membersSection: {
    padding: 20,
    paddingTop: 0,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#04a7c7',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  addMemberGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addMemberText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#04a7c7',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
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
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginRight: 8,
  },
  roleLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminLabel: {
    color: '#04a7c7',
    backgroundColor: 'rgba(4, 167, 199, 0.2)',
  },
  memberStatus: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    marginTop: 2,
  },
  settingsSection: {
    padding: 20,
    paddingTop: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dangerAction: {
    borderBottomColor: 'rgba(255, 107, 107, 0.2)',
  },
  actionText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    marginLeft: 12,
  },
  dangerText: {
    color: '#ff6b6b',
  },
  // Custom Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlert: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 280,
    maxWidth: 350,
    borderWidth: 2,
    borderColor: '#04a7c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertButtons: {
    gap: 8,
  },
  alertButton: {
    backgroundColor: 'rgba(4, 167, 199, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#04a7c7',
  },
  alertButtonDestructive: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#ff6b6b',
  },
  alertButtonLast: {
    marginTop: 4,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  alertButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semibold'),
    color: '#04a7c7',
    textAlign: 'center',
  },
  alertButtonTextDestructive: {
    color: '#ff6b6b',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    marginLeft: 10,
  },
});

export default CommunityInfoScreen;