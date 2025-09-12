import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';

interface CommunityMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'creator' | 'admin' | 'member';
  isOnline: boolean;
  lastSeen: string;
  phoneNumber?: string;
}

interface CommunityMembersScreenProps {
  navigation: any;
  route: any;
}

const CommunityMembersScreen: React.FC<CommunityMembersScreenProps> = ({ navigation, route }) => {
  const { members: initialMembers, communityName, isAdmin } = route.params;
  const [members, setMembers] = useState<CommunityMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMemberPress = (member: CommunityMember) => {
    if (isAdmin && member.role !== 'creator') {
      Alert.alert(
        member.name,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Profile', onPress: () => viewMemberProfile(member) },
          { text: 'Message', onPress: () => messageMember(member) },
          ...(member.role === 'member' ? [
            { text: 'Make Admin', onPress: () => makeAdmin(member) }
          ] : member.role === 'admin' ? [
            { text: 'Remove Admin', onPress: () => removeAdmin(member) }
          ] : []),
          { text: 'Remove from Group', onPress: () => removeMember(member), style: 'destructive' }
        ]
      );
    } else {
      messageMember(member);
    }
  };

  const viewMemberProfile = (member: CommunityMember) => {
    Alert.alert('Profile', `View ${member.name}'s profile`);
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
    Alert.alert(
      'Make Admin',
      `Make ${member.name} a community admin? They will be able to manage members and community settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Make Admin', 
          onPress: () => {
            setMembers(prev => 
              prev.map(m => m.id === member.id ? {...m, role: 'admin'} : m)
            );
            Alert.alert('Success', `${member.name} is now an admin`);
          }
        }
      ]
    );
  };

  const removeAdmin = (member: CommunityMember) => {
    Alert.alert(
      'Remove Admin',
      `Remove admin privileges from ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove Admin', 
          onPress: () => {
            setMembers(prev => 
              prev.map(m => m.id === member.id ? {...m, role: 'member'} : m)
            );
            Alert.alert('Success', `${member.name} is no longer an admin`);
          }
        }
      ]
    );
  };

  const removeMember = (member: CommunityMember) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from ${communityName}? They won't be able to see messages or rejoin unless invited again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setMembers(prev => prev.filter(m => m.id !== member.id));
            Alert.alert('Removed', `${member.name} has been removed from the community`);
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
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
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
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleMemberPress(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666666" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const getSectionTitle = (role: string) => {
    switch (role) {
      case 'creator': return 'Creator';
      case 'admin': return 'Admins';
      case 'member': return 'Members';
      default: return 'Members';
    }
  };

  const groupedMembers = [
    { title: 'Creator', data: filteredMembers.filter(m => m.role === 'creator') },
    { title: 'Admins', data: filteredMembers.filter(m => m.role === 'admin') },
    { title: 'Members', data: filteredMembers.filter(m => m.role === 'member') }
  ].filter(section => section.data.length > 0);

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
          <Text style={styles.headerTitle}>{communityName}</Text>
          <Text style={styles.headerSubtitle}>{members.length} members</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add" size={24} color="#04a7c7" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Members List */}
      <FlatList
        data={groupedMembers}
        keyExtractor={(item) => item.title}
        renderItem={({ item: section }) => (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {section.title} ({section.data.length})
              </Text>
            </View>
            {section.data.map((member) => (
              <View key={member.id}>
                {renderMember({ item: member })}
              </View>
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
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
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semibold'),
    color: '#04a7c7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  actionButton: {
    padding: 8,
  },
});

export default CommunityMembersScreen;