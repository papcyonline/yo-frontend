// src/screens/chat/AIAssistantScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { getSystemFont } from '../../config/constants';

// Hooks
import { useChat } from '../../hooks/useChat';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

// Utils
import { Message, createAIMessage } from '../../utils/chatHelpers';

const { width } = Dimensions.get('window');

interface AIAssistantScreenProps {
  navigation: any;
  route: any;
}

const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({ navigation, route }) => {
  const [isAITyping, setIsAITyping] = useState(false);

  // Initial AI conversation
  const initialMessages: Message[] = [
    {
      id: '1',
      text: 'Hello! I\'m your YoFam AI Assistant. I already know your basic information from your profile. I can help you discover family connections, research your heritage, and guide you through building your family tree. What would you like to explore about your family today?',
      timestamp: new Date(Date.now() - 30000),
      isFromCurrentUser: false,
      status: 'read',
      type: 'ai'
    }
  ];

  // Custom hooks
  const chat = useChat({
    initialMessages,
    onMessageSent: handleUserMessage
  });

  const voiceRecorder = useVoiceRecording();

  // AI response templates (avoids asking for basic info already collected in signup)
  const aiResponses = {
    greeting: [
      "Hello! Since I already have your basic details, let's dive into your family research. What would you like to explore?",
      "Hi there! I can help you discover family connections and research your heritage. What interests you most?",
      "Welcome back! I'm ready to help with your family tree and genealogy research. Where shall we start?"
    ],
    family_search: [
      "I can help you search for family members! Tell me about relatives you'd like to find - parents, grandparents, siblings, or extended family.",
      "Family search is one of my specialties! Share any details about the relatives you're looking for - their names, relationships, or any stories about them.",
      "Let's find your family! Tell me about the family members you want to connect with or learn more about."
    ],
    heritage: [
      "I'd love to help you explore your cultural heritage! Tell me about your family's origins or any traditions you've heard about.",
      "Heritage research is fascinating! Share any family stories about where your ancestors came from or cultural traditions.",
      "Your family heritage has so many layers to discover! What aspects of your ancestry would you like to explore?"
    ],
    stories: [
      "Family stories are precious! I can help you organize and research the stories passed down in your family.",
      "Those family stories often contain valuable clues for genealogy research. What family stories or legends have been shared with you?",
      "I love helping people preserve their family stories! Tell me about any interesting tales or traditions in your family."
    ],
    relationships: [
      "Tell me about your family relationships! Are you looking for parents, siblings, grandparents, or other relatives?",
      "I can help you understand your family connections. What family relationships are you most curious about?",
      "Family relationships can be complex and beautiful. Which family members would you like to learn more about?"
    ],
    default: [
      "That's an interesting question! Let me help you with that family research.",
      "I'm here to assist with your family connections and heritage. Could you provide more details?",
      "I'd be happy to help with your family tree! Can you tell me more about what you're looking for?"
    ]
  };

  // Handle user messages and generate AI responses
  async function handleUserMessage(message: Message) {
    if (message.type === 'text' && message.text) {
      setIsAITyping(true);
      
      // Simulate AI processing time
      setTimeout(() => {
        const response = generateAIResponse(message.text!);
        chat.receiveMessage(response, 'ai');
        setIsAITyping(false);
      }, 1500 + Math.random() * 1500); // 1.5-3 seconds delay
    }
  }

  // Simple AI response generation based on keywords (avoids asking for basic info)
  function generateAIResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Redirect basic info questions to family research
    if (message.includes('name') && (message.includes('what') || message.includes('my'))) {
      return "I already have your name from your profile! Let's focus on finding other family members. Tell me about relatives you'd like to connect with.";
    }
    
    if (message.includes('age') || message.includes('old') || message.includes('born')) {
      return "I have your birth information already! Instead, tell me about your family members - are you looking for parents, siblings, or extended family?";
    }
    
    if (message.includes('location') || message.includes('where') || message.includes('live')) {
      return "I know where you're located! Let's explore your family's geographic history. Do you know where your parents or grandparents came from?";
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return getRandomResponse(aiResponses.greeting);
    }
    
    if (message.includes('family') && (message.includes('find') || message.includes('search') || message.includes('looking'))) {
      return getRandomResponse(aiResponses.family_search);
    }
    
    if (message.includes('parent') || message.includes('mother') || message.includes('father') || message.includes('sibling') || message.includes('brother') || message.includes('sister')) {
      return getRandomResponse(aiResponses.relationships);
    }
    
    if (message.includes('heritage') || message.includes('origin') || message.includes('ancestor') || message.includes('genealogy')) {
      return getRandomResponse(aiResponses.heritage);
    }
    
    if (message.includes('story') || message.includes('stories') || message.includes('told') || message.includes('grandfather') || message.includes('grandmother')) {
      return getRandomResponse(aiResponses.stories);
    }
    
    if (message.includes('ireland') || message.includes('irish')) {
      return "Ireland has such rich genealogical records! Tell me about your Irish connections - do you have Irish family members or ancestors you'd like to research?";
    }
    
    if (message.includes('help') || message.includes('how')) {
      return "I can help you with: 🔍 Finding family members, 📜 Researching your heritage, 🌳 Building your family tree, 📖 Organizing family stories, 🔗 Making family connections. Since I already know your basic info, what family research interests you most?";
    }
    
    return getRandomResponse(aiResponses.default);
  }

  function getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Quick suggestion buttons (focused on family research, not basic info)
  const quickSuggestions = [
    { id: 1, text: "Find my family members", icon: "people" },
    { id: 2, text: "Research my heritage", icon: "library" },
    { id: 3, text: "Share family stories", icon: "book" },
    { id: 4, text: "Connect with relatives", icon: "heart" },
  ];

  const handleSuggestionPress = (suggestion: string) => {
    chat.sendTextMessage(suggestion);
  };

  const handleSendText = (text: string) => {
    chat.sendTextMessage(text);
  };

  const handleStartVoiceRecording = async () => {
    await voiceRecorder.startRecording();
  };

  const handleStopVoiceRecording = async () => {
    const result = await voiceRecorder.stopRecording();
    if (result) {
      // For AI assistant, convert voice to text (placeholder)
      chat.sendTextMessage("Voice message: " + voiceRecorder.formatDuration(result.duration));
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.aiLabel}>
          <Ionicons name="sparkles" size={12} color="#8b5cf6" />
          <Text style={styles.aiLabelText}>AI Assistant</Text>
        </View>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
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
          colors={['rgba(139, 92, 246, 0.3)', 'transparent']}
          style={styles.headerFlare}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons 
              name={Platform.OS === 'android' ? 'arrow-back' : 'chevron-back'} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
          
          <View style={styles.aiInfo}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={20} color="#8b5cf6" />
            </View>
            
            <View style={styles.aiDetails}>
              <Text style={styles.aiName}>AI Assistant</Text>
              <Text style={styles.aiStatus}>
                {isAITyping ? 'Typing...' : 'Online • Ready to help'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionBtn}
              onPress={() => {
                chat.clearMessages();
                chat.receiveMessage(
                  "I'm ready to help you with your family research! Since I have your basic info, let's focus on finding your family members or exploring your heritage. What interests you?", 
                  'ai'
                );
              }}
            >
              <Ionicons name="refresh" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
          ListFooterComponent={isAITyping ? renderTypingIndicator : null}
        />
      </View>

      {/* Quick Suggestions */}
      {chat.messages.length <= 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
          <View style={styles.suggestionsGrid}>
            {quickSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress(suggestion.text)}
              >
                <Ionicons name={suggestion.icon as any} size={16} color="#8b5cf6" />
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Message Input - No attachments for AI Assistant */}
      <MessageInput
        onSendText={handleSendText}
        onStartVoiceRecording={handleStartVoiceRecording}
        onStopVoiceRecording={handleStopVoiceRecording}
        onShowMediaPicker={() => {}} // Disabled for AI assistant
        isRecording={voiceRecorder.isRecording}
        recordingDuration={voiceRecorder.recordingDuration}
        recordingAnim={voiceRecorder.recordingAnim}
        placeholder="Ask me about your family..."
        maxLength={500}
        hideAttachment={true} // Hide attachment button for AI
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
  aiInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiDetails: {
    flex: 1,
  },
  aiName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  aiStatus: {
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
  typingContainer: {
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: width * 0.8,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  aiLabelText: {
    fontSize: 10,
    fontFamily: getSystemFont('semiBold'),
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8b5cf6',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#6b7280',
    marginBottom: 8,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#8b5cf6',
  },
});

export default AIAssistantScreen;