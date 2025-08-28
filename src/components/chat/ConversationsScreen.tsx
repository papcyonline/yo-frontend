// src/screens/chat/ConversationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MediaPicker } from './mediaPicker';
import { getSystemFont } from '../../config/constants';

// Hooks
import { useChat } from '../../hooks/useChat';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useMediaPicker } from './useMediaPicker';

// Utils
import { Message, ChatUser } from '../../utils/chatHelpers';

const { width } = Dimensions.get('window');

interface ConversationScreenProps {
  navigation: any;
  route: any;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  members: ChatUser[];
  avatar?: string;
  createdBy: string;
  createdAt: Date;
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ navigation, route }) => {
  const { groupInfo, currentUser } = route.params || {};
  
  // State
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  
  // Group data from route params (no fallback mock data)
  const group = groupInfo || {
    id: 'temp',
    name: 'Group Chat',
    description: '',
    members: [],
    createdBy: 'Unknown',
    createdAt: new Date()
  };

  // Messages from API - no initial mock messages
  const initialMessages: Message[] = [];

  // Custom hooks
  const chat = useChat({
    initialMessages,
    onMessageSent: (message) => {
      console.log('Group message sent:', message);
    }
  });

  const voiceRecorder = useVoiceRecording();
  const mediaPicker = useMediaPicker();

  // Handlers
  const handleSendText = (text: string) => {
    chat.sendTextMessage(text);
  };

  const handleStartVoiceRecording = async () => {
    const success = await voiceRecorder.startRecording();
    if (!success) {
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const handleStopVoiceRecording = async () => {
    const result = await voiceRecorder.stopRecording();
    if (result) {
      chat.sendVoiceMessage(result.uri, result.duration);
    }
  };

  const handleMediaSelected = async (
    picker: () => Promise<any>, 
    type: 'image' | 'video'
  ) => {
    const result = await picker();
    if (result) {
      chat.sendMediaMessage(result.uri, result.type, result.size, result.duration);
    }
  };

  const handleGroupInfoPress = () => {
    setShowGroupInfo(!showGroupInfo);
  };

  const handleAddMember = () => {
    Alert.alert('Add Member', 'Feature coming soon!');
  };

  const handleGroupCall = () => {
    Alert.alert(
      'Group Call',
      `Start a group call with ${group.members.length} members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Call', 
          onPress: () => {
            Alert.alert('Group Call', 'Starting group call...');
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      onMediaPress={(uri, type) => Alert.alert('Media', `View ${type}: ${uri}`)}
      onVoicePlay={(uri, duration) => Alert.alert('Voice', `Play voice: ${duration}s`)}
    />
  );

  const renderGroupInfo = () => (
    <View style={styles.groupInfoContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {group.members.map((member: any, index: number) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{member.name[0]}</Text>
              {member.isOnline && <View style={styles.memberOnlineIndicator} />}
            </View>
            <Text style={styles.memberName} numberOfLines={1}>
              {member.name}
            </Text>
            <Text style={styles.memberStatus} numberOfLines={1}>
              {member.lastSeen}
            </Text>
          </View>
        ))}
        
        {/* Add member button */}
        <TouchableOpacity style={styles.addMemberCard} onPress={handleAddMember}>
          <View style={styles.addMemberAvatar}>
            <Ionicons name="add" size={20} color="#015b01" />
          </View>
          <Text style={styles.addMemberText}>Add Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#015b01" />
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#015b01', '#015b01']}
          style={styles.headerGradient}
        />
        
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
            <Ionicons 
              name={Platform.OS === 'android' ? 'arrow-back' : 'chevron-back'} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.groupInfo}
            onPress={handleGroupInfoPress}
          >
            <View style={styles.groupAvatar}>
              <Ionicons name="people" size={20} color="#22c55e" />
            </View>
            
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.memberCount}>
                {group.members.length} members
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionBtn}
              onPress={handleGroupCall}
            >
              <Ionicons name="call" size={22} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerActionBtn}
              onPress={() => {
                Alert.alert(
                  'Group Options',
                  'Choose an action:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Group Info', onPress: handleGroupInfoPress },
                    { text: 'Add Member', onPress: handleAddMember },
                    { text: 'Mute Group', onPress: () => Alert.alert('Group muted') }
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-vertical" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Group Members Info */}
      {showGroupInfo && renderGroupInfo()}

      {/* Messages List */}
      <View style={styles.chatBackground}>
        <FlatList
          ref={chat.flatListRef}
          data={chat.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chat.scrollToBottom()}
        />
      </View>

      {/* Voice Recording Overlay */}
      {voiceRecorder.isRecording && (
        <View style={styles.recordingOverlay}>
          <View style={styles.recordingContainer}>
            <Ionicons name="mic" size={32} color="#ef4444" />
            <Text style={styles.recordingText}>Recording...</Text>
            <Text style={styles.recordingDuration}>
              {voiceRecorder.formatDuration(voiceRecorder.recordingDuration)}
            </Text>
          </View>
        </View>
      )}

      {/* Message Input */}
      <MessageInput
        onSendText={handleSendText}
        onStartVoiceRecording={handleStartVoiceRecording}
        onStopVoiceRecording={handleStopVoiceRecording}
        onShowMediaPicker={() => setShowMediaPicker(true)}
        isRecording={voiceRecorder.isRecording}
        recordingDuration={voiceRecorder.recordingDuration}
        recordingAnim={voiceRecorder.recordingAnim}
        placeholder="Message the group..."
        maxLength={1000}
      />

      {/* Media Picker Modal */}
      <MediaPicker
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onTakePhoto={() => handleMediaSelected(mediaPicker.takePhoto, 'image')}
        onPickImage={() => handleMediaSelected(mediaPicker.pickImage, 'image')}
        onPickVideo={() => handleMediaSelected(mediaPicker.pickVideo, 'video')}
        onRecordVideo={() => handleMediaSelected(mediaPicker.recordVideo, 'video')}
        loading={mediaPicker.isLoading}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  memberCount: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfoContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  memberCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#374151',
  },
  memberOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberName: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 10,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    textAlign: 'center',
  },
  addMemberCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  addMemberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(1, 91, 1, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#015b01',
    borderStyle: 'dashed',
  },
  addMemberText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#015b01',
    textAlign: 'center',
  },
  chatBackground: {
    flex: 1,
    position: 'relative',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingVertical: 16,
    paddingBottom: 8,
  },
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  recordingContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
  },
  recordingText: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ef4444',
    marginTop: 12,
  },
  recordingDuration: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    marginTop: 8,
  },
});

export default ConversationScreen;