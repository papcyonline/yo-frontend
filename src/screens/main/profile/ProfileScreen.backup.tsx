import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../../config/constants';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  profileCompleted: boolean;
  dateOfBirth?: string;
  placeOfBirth?: string;
  currentAddress?: string;
  fatherName?: string;
  motherName?: string;
  bio?: string;
  familyOriginStories?: string;
  grandfatherStories?: string;
  uncleStories?: string;
  familyTraditions?: string;
  primarySchool?: string;
  highSchool?: string;
  university?: string;
  closeSchoolFriends?: string;
  hobbies?: string;
  profession?: string;
  languages?: string;
  religiousBackground?: string;
}

interface ProfileScreenProps {
  navigation: any;
  route: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { user, isOwnProfile = false } = route.params || {};
  
  const [activeTab, setActiveTab] = useState('about');

  const getFirstName = () => {
    if (user?.fullName && user.fullName !== 'User') {
      return user.fullName.split(' ')[0];
    }
    return 'User';
  };

  const getCompletionPercentage = () => {
    if (!user) return 0;
    
    let completed = 0;
    const fields = [
      user.fullName && user.fullName !== 'User',
      user.email,
      user.phone,
      user.dateOfBirth,
      user.placeOfBirth,
      user.currentAddress,
      user.bio,
      user.familyOriginStories,
      user.profession,
      user.hobbies,
      user.fatherName,
      user.motherName,
    ];
    
    fields.forEach(field => {
      if (field) completed += 1;
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const profileSections = [
    {
      title: 'Basic Information',
      items: [
        { label: 'Full Name', value: user?.fullName || 'Not provided', icon: 'person' },
        { label: 'Email', value: user?.email || 'Not provided', icon: 'mail' },
        { label: 'Phone', value: user?.phone || 'Not provided', icon: 'call' },
        { label: 'Date of Birth', value: user?.dateOfBirth || 'Not provided', icon: 'calendar' },
        { label: 'Place of Birth', value: user?.placeOfBirth || 'Not provided', icon: 'location' },
        { label: 'Current Address', value: user?.currentAddress || 'Not provided', icon: 'home' },
      ]
    },
    {
      title: 'Family Information',
      items: [
        { label: 'Father\'s Name', value: user?.fatherName || 'Not provided', icon: 'man' },
        { label: 'Mother\'s Name', value: user?.motherName || 'Not provided', icon: 'woman' },
        { label: 'Siblings', value: user?.siblings || 'Not provided', icon: 'people' },
      ]
    },
    {
      title: 'Personal Details',
      items: [
        { label: 'Bio', value: user?.bio || 'Not provided', icon: 'document-text', multiline: true },
        { label: 'Profession', value: user?.profession || 'Not provided', icon: 'briefcase' },
        { label: 'Hobbies', value: user?.hobbies || 'Not provided', icon: 'heart' },
        { label: 'Languages', value: user?.languages || 'Not provided', icon: 'language' },
        { label: 'Religious Background', value: user?.religiousBackground || 'Not provided', icon: 'book' },
      ]
    },
    {
      title: 'Family Stories & Heritage',
      items: [
        { label: 'Family Origin Stories', value: user?.familyOriginStories || 'Not provided', icon: 'library', multiline: true },
        { label: 'Grandfather\'s Stories', value: user?.grandfatherStories || 'Not provided', icon: 'time', multiline: true },
        { label: 'Uncle\'s Stories', value: user?.uncleStories || 'Not provided', icon: 'chatbubbles', multiline: true },
        { label: 'Family Traditions', value: user?.familyTraditions || 'Not provided', icon: 'star', multiline: true },
      ]
    },
    {
      title: 'Education',
      items: [
        { label: 'Primary School', value: user?.primarySchool || 'Not provided', icon: 'school' },
        { label: 'High School', value: user?.highSchool || 'Not provided', icon: 'school' },
        { label: 'University', value: user?.university || 'Not provided', icon: 'school' },
        { label: 'Close School Friends', value: user?.closeSchoolFriends || 'Not provided', icon: 'people' },
      ]
    },
  ];

  const renderProfileSection = (section: any) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCard}>
        {section.items.map((item: any, index: number) => (
          <View 
            key={index} 
            style={[
              styles.profileItem,
              index < section.items.length - 1 && styles.itemBorder
            ]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={18} color="#015b01" />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            <Text style={[
              styles.itemValue,
              item.multiline && styles.itemValueMultiline,
              item.value === 'Not provided' && styles.itemValueEmpty
            ]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#015b01" />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <Ionicons name="person-outline" size={120} color="rgba(1, 91, 1, 0.03)" style={[styles.bgIcon, { top: 150, left: -20 }]} />
        <Ionicons name="heart-outline" size={100} color="rgba(1, 91, 1, 0.03)" style={[styles.bgIcon, { top: 400, right: -10 }]} />
        <Ionicons name="document-text-outline" size={90} color="rgba(1, 91, 1, 0.03)" style={[styles.bgIcon, { bottom: 200, left: 50 }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#015b01', '#015b01']}
          style={styles.headerGradient}
        />
        
        {/* Green flare at top center */}
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.3)', 'transparent']}
          style={styles.headerFlare}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isOwnProfile ? 'My Profile' : `${getFirstName()}'s Profile`}
          </Text>
          
          {isOwnProfile && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Summary */}
        <View style={styles.profileSummary}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getFirstName()[0]?.toUpperCase()}</Text>
            </View>
            {user?.profileCompleted && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.fullName && user.fullName !== 'User' ? user.fullName : 'Profile Incomplete'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
            
            <View style={styles.completionContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${getCompletionPercentage()}%` }]} 
                />
              </View>
              <Text style={styles.completionText}>
                Profile {getCompletionPercentage()}% complete
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { key: 'about', label: 'About', icon: 'person' },
            { key: 'stories', label: 'Stories', icon: 'book' },
            { key: 'education', label: 'Education', icon: 'school' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#015b01' : '#ffffff'}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'about' && (
          <>
            {profileSections.slice(0, 3).map(renderProfileSection)}
          </>
        )}
        
        {activeTab === 'stories' && (
          <>
            {profileSections.slice(3, 4).map(renderProfileSection)}
          </>
        )}
        
        {activeTab === 'education' && (
          <>
            {profileSections.slice(4).map(renderProfileSection)}
          </>
        )}

        {/* Actions Section for own profile */}
        {isOwnProfile && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('PersonalDetails', {
                userId: user?.id,
                email: user?.email,
                phone: user?.phone,
                fromDashboard: true
              })}
            >
              <Ionicons name="add-circle" size={20} color="#015b01" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Add More Details
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgIcon: {
    position: 'absolute',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 10,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerFlare: {
    position: 'absolute',
    top: 0,
    left: width * 0.3,
    right: width * 0.3,
    height: 100,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#015b01',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  completionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  completionText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingVertical: 5,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  activeTabText: {
    color: '#015b01',
    fontFamily: getSystemFont('bold'),
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  section: {
    margin: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  profileItem: {
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(1, 91, 1, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
  },
  itemValue: {
    fontSize: 15,
    fontFamily: getSystemFont('regular'),
    color: '#4b5563',
    lineHeight: 22,
  },
  itemValueMultiline: {
    lineHeight: 24,
  },
  itemValueEmpty: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actionsSection: {
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#015b01',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#015b01',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#015b01',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#015b01',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;