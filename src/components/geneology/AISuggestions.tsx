import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';

interface AISuggestion {
  id: string;
  name: string;
  relationshipType: 'parent' | 'sibling' | 'child' | 'spouse' | 'cousin' | 'grandparent' | 'grandchild';
  confidence: number;
  matchReasons: string[];
  photo?: string;
  birthYear?: number;
  location?: string;
  commonConnections?: string[];
  aiAnalysis: string;
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onViewMore: () => void;
  isLoading?: boolean;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  onViewMore,
  isLoading = false,
}) => {
  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'parent': return '#8B5CF6';
      case 'child': return '#10B981';
      case 'sibling': return '#F59E0B';
      case 'spouse': return '#EF4444';
      case 'grandparent': return '#6366F1';
      case 'grandchild': return '#14B8A6';
      case 'cousin': return '#F97316';
      default: return '#6B7280';
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'parent': return 'arrow-up';
      case 'child': return 'arrow-down';
      case 'sibling': return 'people';
      case 'spouse': return 'heart';
      case 'grandparent': return 'arrow-up-circle';
      case 'grandchild': return 'arrow-down-circle';
      case 'cousin': return 'git-network';
      default: return 'person';
    }
  };

  const formatRelationshipType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
            <Text style={styles.title}>AI Suggestions</Text>
          </View>
          <Text style={styles.subtitle}>Finding potential family connections...</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.loadingSuggestion}>
              <View style={styles.loadingAvatar} />
              <View style={styles.loadingContent}>
                <View style={styles.loadingTitle} />
                <View style={styles.loadingSubtitle} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
            <Text style={styles.title}>AI Suggestions</Text>
          </View>
          <Text style={styles.subtitle}>No new suggestions at this time</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            AI is continuously analyzing your family tree for potential connections. 
            Check back later for new suggestions!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={24} color="#FFD700" />
          <Text style={styles.title}>AI Family Suggestions</Text>
        </View>
        <Text style={styles.subtitle}>
          {suggestions.length} potential connection{suggestions.length > 1 ? 's' : ''} found
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsScroll}
        contentContainerStyle={styles.suggestionsContainer}
      >
        {suggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestionCard}>
            {/* Confidence Badge */}
            <View style={styles.confidenceBadge}>
              <Ionicons name="analytics" size={12} color="#FFFFFF" />
              <Text style={styles.confidenceText}>{suggestion.confidence}%</Text>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              {suggestion.photo ? (
                <Image source={{ uri: suggestion.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {suggestion.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
              
              <Text style={styles.suggestionName}>{suggestion.name}</Text>
              
              <View style={[styles.relationshipBadge, { backgroundColor: getRelationshipColor(suggestion.relationshipType) }]}>
                <Ionicons 
                  name={getRelationshipIcon(suggestion.relationshipType) as any} 
                  size={12} 
                  color="#FFFFFF" 
                />
                <Text style={styles.relationshipText}>
                  {formatRelationshipType(suggestion.relationshipType)}
                </Text>
              </View>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              {suggestion.birthYear && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={styles.detailText}>Born ~{suggestion.birthYear}</Text>
                </View>
              )}
              
              {suggestion.location && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.detailText}>{suggestion.location}</Text>
                </View>
              )}
              
              {suggestion.commonConnections && suggestion.commonConnections.length > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={14} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {suggestion.commonConnections.length} mutual connection{suggestion.commonConnections.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Match Reasons */}
            <View style={styles.reasonsSection}>
              <Text style={styles.reasonsTitle}>Match Reasons:</Text>
              {suggestion.matchReasons.slice(0, 3).map((reason, index) => (
                <View key={index} style={styles.reasonItem}>
                  <View style={styles.reasonDot} />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>

            {/* AI Analysis */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisTitle}>AI Analysis:</Text>
              <Text style={styles.analysisText}>{suggestion.aiAnalysis}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => onRejectSuggestion(suggestion.id)}
              >
                <Ionicons name="close" size={16} color="#EF4444" />
                <Text style={styles.rejectButtonText}>Pass</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => onAcceptSuggestion(suggestion)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Add to Tree</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {/* View More Card */}
        <TouchableOpacity style={styles.viewMoreCard} onPress={onViewMore}>
          <View style={styles.viewMoreContent}>
            <Ionicons name="ellipsis-horizontal" size={32} color="#4A90E2" />
            <Text style={styles.viewMoreText}>View All Suggestions</Text>
            <Text style={styles.viewMoreSubtext}>Explore more potential connections</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  suggestionsScroll: {
    paddingLeft: 20,
  },
  suggestionsContainer: {
    paddingRight: 20,
  },
  suggestionCard: {
    width: 280,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
  },
  confidenceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarInitials: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#FFFFFF',
  },
  suggestionName: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  relationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  relationshipText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: '#9CA3AF',
    flex: 1,
  },
  reasonsSection: {
    marginBottom: 16,
  },
  reasonsTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  reasonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A90E2',
    marginTop: 6,
  },
  reasonText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#D1D5DB',
    flex: 1,
    lineHeight: 16,
  },
  analysisSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  analysisTitle: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#4A90E2',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#D1D5DB',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    gap: 4,
  },
  rejectButtonText: {
    fontSize: 13,
    fontFamily: getSystemFont('semiBold'),
    color: '#EF4444',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    gap: 4,
  },
  acceptButtonText: {
    fontSize: 13,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
  viewMoreCard: {
    width: 200,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginRight: 20,
  },
  viewMoreContent: {
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#4A90E2',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  viewMoreSubtext: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingHorizontal: 20,
  },
  loadingSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  loadingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  loadingContent: {
    flex: 1,
  },
  loadingTitle: {
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 6,
    width: '60%',
  },
  loadingSubtitle: {
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    width: '40%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});