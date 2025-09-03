// CreateCommunityScreen.tsx - Create new community/group
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

interface CreateCommunityScreenProps {
  navigation: any;
}

const CreateCommunityScreen: React.FC<CreateCommunityScreenProps> = ({ navigation }) => {
  const { token } = useAuthStore();
  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Family');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'Family', name: 'Family', icon: 'people', color: '#22c55e' },
    { id: 'Heritage', name: 'Heritage', icon: 'library', color: '#8b5cf6' },
    { id: 'Location', name: 'Location', icon: 'location', color: '#f59e0b' },
    { id: 'Surname', name: 'Surname', icon: 'bookmark', color: '#ef4444' },
    { id: 'DNA Research', name: 'DNA Research', icon: 'analytics', color: '#06b6d4' },
    { id: 'General', name: 'General', icon: 'chatbubbles', color: '#6366f1' },
  ];

  const handleCreateCommunity = async () => {
    if (!communityName.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for your community');
      return;
    }

    try {
      setLoading(true);
      logger.debug('Creating new community', { name: communityName, category: selectedCategory });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/communities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: communityName.trim(),
          description: description.trim(),
          category: selectedCategory,
          isPrivate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        logger.info('Community created successfully', result.data.community.id);
        
        Alert.alert(
          'Community Created!',
          `"${communityName}" has been created successfully. You can now start inviting members!`,
          [
            {
              text: 'View Community',
              onPress: () => {
                navigation.replace('CommunityDetails', {
                  communityId: result.data.community.id,
                  community: result.data.community
                });
              }
            },
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to create community');
      }
    } catch (error) {
      logger.error('Error creating community', error);
      Alert.alert(
        'Creation Failed',
        'Failed to create community. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Category</Text>
      <Text style={styles.sectionDescription}>
        Choose a category that best describes your community
      </Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <LinearGradient
              colors={selectedCategory === category.id 
                ? [category.color, category.color + '80']
                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
              }
              style={styles.categoryGradient}
            >
              <Ionicons 
                name={category.icon as any} 
                size={24} 
                color={selectedCategory === category.id ? '#ffffff' : category.color} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText
              ]}>
                {category.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPrivacySettings = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Privacy</Text>
      <View style={styles.privacyOptions}>
        <TouchableOpacity 
          style={[styles.privacyOption, !isPrivate && styles.selectedPrivacyOption]}
          onPress={() => setIsPrivate(false)}
        >
          <View style={styles.privacyOptionContent}>
            <Ionicons name="globe" size={24} color={!isPrivate ? '#0091ad' : '#6b7280'} />
            <View style={styles.privacyOptionText}>
              <Text style={[styles.privacyOptionTitle, !isPrivate && styles.selectedPrivacyTitle]}>
                Public
              </Text>
              <Text style={styles.privacyOptionDescription}>
                Anyone can find and join this community
              </Text>
            </View>
            <View style={[styles.radioButton, !isPrivate && styles.selectedRadioButton]}>
              {!isPrivate && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.privacyOption, isPrivate && styles.selectedPrivacyOption]}
          onPress={() => setIsPrivate(true)}
        >
          <View style={styles.privacyOptionContent}>
            <Ionicons name="lock-closed" size={24} color={isPrivate ? '#0091ad' : '#6b7280'} />
            <View style={styles.privacyOptionText}>
              <Text style={[styles.privacyOptionTitle, isPrivate && styles.selectedPrivacyTitle]}>
                Private
              </Text>
              <Text style={styles.privacyOptionDescription}>
                Only invited members can join this community
              </Text>
            </View>
            <View style={[styles.radioButton, isPrivate && styles.selectedRadioButton]}>
              {isPrivate && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Community</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Community Name */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Community Name</Text>
            <Text style={styles.sectionDescription}>
              Give your community a clear and memorable name
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="people" size={20} color="#0091ad" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter community name..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={communityName}
                onChangeText={setCommunityName}
                maxLength={50}
              />
            </View>
            <Text style={styles.characterCount}>{communityName.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionDescription}>
              Describe the purpose and goals of your community
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="What is this community about? What brings members together?"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>
            <Text style={styles.characterCount}>{description.length}/300</Text>
          </View>

          {/* Category Selection */}
          {renderCategorySelector()}

          {/* Privacy Settings */}
          {renderPrivacySettings()}

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateCommunity}
              disabled={loading || !communityName.trim() || !description.trim()}
            >
              <LinearGradient
                colors={loading || !communityName.trim() || !description.trim() 
                  ? ['#374151', '#4b5563']
                  : ['#0091ad', '#04a7c7']
                }
                style={styles.createButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#ffffff" />
                    <Text style={styles.createButtonText}>Create Community</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>
              By creating a community, you agree to moderate content and ensure it follows our community guidelines.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
  },
  textAreaContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedCategoryButton: {
    borderColor: 'rgba(0,145,173,0.5)',
  },
  categoryGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#ffffff',
    fontFamily: getSystemFont('bold'),
  },
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedPrivacyOption: {
    borderColor: 'rgba(0,145,173,0.5)',
    backgroundColor: 'rgba(0,145,173,0.1)',
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  privacyOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  selectedPrivacyTitle: {
    color: '#ffffff',
  },
  privacyOptionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#0091ad',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0091ad',
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

export default CreateCommunityScreen;