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

const { width, height } = Dimensions.get('window');

interface Match {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  matchPercentage: number;
  relationship: string;
  location: string;
  isOnline: boolean;
  lastSeen: string;
  phone?: string;
  email?: string;
}

interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  profileCompleted: boolean;
}

interface MatchProfileProps {
  navigation: any;
  route: any;
}

const MatchProfileScreen: React.FC<MatchProfileProps> = ({ navigation, route }) => {
  const { match, user } = route.params;
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return '#22c55e'; // Green
    if (percentage >= 50) return '#84cc16'; // Light green
    if (percentage >= 40) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const maskPhone = (phone: string) => {
    if (!phone) return 'Not available';
    if (showFullPhone) return phone;
    return phone.replace(/(\+\d{1,3})\s?(\d{2,3})\s?(\d{4})\s?(\d{4})/, '$1 $2 ****');
  };

  const maskEmail = (email: string) => {
    if (!email) return 'Not available';
    if (showFullEmail) return email;
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.slice(0, 2) + '*'.repeat(username.length - 2)
      : '**';
    return `${maskedUsername}@${domain}`;
  };

  const handleChatPress = () => {
    navigation.navigate('Chat', {
      targetUser: match,
      currentUser: user
    });
  };

  const handleConnectRequest = () => {
    Alert.alert(
      'Send Connection Request',
      `Send a connection request to ${match.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          onPress: () => {
            Alert.alert('Request Sent!', `Your connection request has been sent to ${match.name}.`);
          }
        }
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${match.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('User Blocked', `${match.name} has been blocked.`);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      'Please select a reason for reporting this user:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Fake Profile', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Other', onPress: () => Alert.alert('Reported', 'Thank you for your report.') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <Ionicons name="people-outline" size={120} color="rgba(34, 197, 94, 0.03)" style={[styles.bgIcon, { top: 150, left: -20 }]} />
        <Ionicons name="heart-outline" size={100} color="rgba(34, 197, 94, 0.03)" style={[styles.bgIcon, { top: 400, right: -10 }]} />
        <Ionicons name="chatbubbles-outline" size={90} color="rgba(34, 197, 94, 0.03)" style={[styles.bgIcon, { bottom: 200, left: 50 }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#15803d" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profile Match</Text>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Options',
                'Choose an action:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Report User', onPress: handleReportUser },
                  { text: 'Block User', onPress: handleBlockUser, style: 'destructive' }
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#15803d" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{match.name[0]}</Text>
              </View>
              {match.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{match.name}</Text>
              <Text style={styles.profileRelationship}>{match.relationship}</Text>
              <Text style={styles.profileLocation}>
                <Ionicons name="location-outline" size={14} color="#6b7280" />
                {' '}{match.location}
              </Text>
              <Text style={styles.lastSeen}>{match.lastSeen}</Text>
            </View>
            
            <View style={styles.matchBadge}>
              <View style={[styles.matchCircle, { borderColor: getMatchColor(match.matchPercentage) }]}>
                <Text style={[styles.matchPercentageText, { color: getMatchColor(match.matchPercentage) }]}>
                  {match.matchPercentage}%
                </Text>
              </View>
              <Text style={styles.matchLabel}>Match</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>About {match.name.split(' ')[0]}</Text>
            <Text style={styles.bioText}>{match.bio}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.contactCard}>
            {/* Phone */}
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => setShowFullPhone(!showFullPhone)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={20} color="#22c55e" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{maskPhone(match.phone || '')}</Text>
              </View>
              <View style={styles.contactAction}>
                <Ionicons 
                  name={showFullPhone ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity 
              style={[styles.contactItem, styles.contactItemBorder]}
              onPress={() => setShowFullEmail(!showFullEmail)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={20} color="#3b82f6" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{maskEmail(match.email || '')}</Text>
              </View>
              <View style={styles.contactAction}>
                <Ionicons 
                  name={showFullEmail ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {/* Chat */}
            <TouchableOpacity 
              style={[styles.contactItem, styles.chatItem]}
              onPress={handleChatPress}
            >
              <View style={[styles.contactIcon, styles.chatIcon]}>
                <Ionicons name="chatbubbles" size={20} color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Start Conversation</Text>
                <Text style={styles.contactValue}>Send a message to {match.name.split(' ')[0]}</Text>
              </View>
              <View style={styles.contactAction}>
                <Ionicons name="arrow-forward" size={20} color="#8b5cf6" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={handleConnectRequest}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.connectButtonText}>Send Connection Request</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="bookmark-outline" size={24} color="#6b7280" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color="#6b7280" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
              <Text style={styles.actionButtonText}>More Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Tree Preview */}
        <View style={styles.familyTreeSection}>
          <Text style={styles.sectionTitle}>Potential Family Connection</Text>
          <View style={styles.familyTreeCard}>
            <Text style={styles.familyTreeText}>
              Based on your family stories and background, {match.name.split(' ')[0]} might be related through your shared Irish heritage. 
              AI analysis suggests a possible connection through your great-grandparents.
            </Text>
            <TouchableOpacity style={styles.familyTreeButton}>
              <Text style={styles.familyTreeButtonText}>View Family Tree</Text>
              <Ionicons name="arrow-forward" size={16} color="#22c55e" />
            </TouchableOpacity>
          </View>
        </View>

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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803d',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  profileSection: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#374151',
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
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileRelationship: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 8,
  },
  profileLocation: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
  },
  matchBadge: {
    alignItems: 'center',
  },
  matchCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  matchPercentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  bioSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 20,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4b5563',
    lineHeight: 24,
  },
  contactSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  chatItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatIcon: {
    backgroundColor: '#8b5cf6',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
  },
  contactAction: {
    marginLeft: 12,
  },
  actionsSection: {
    margin: 16,
    marginTop: 0,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 4,
  },
  familyTreeSection: {
    margin: 16,
    marginTop: 0,
  },
  familyTreeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  familyTreeText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  familyTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  familyTreeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    marginRight: 6,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default MatchProfileScreen;