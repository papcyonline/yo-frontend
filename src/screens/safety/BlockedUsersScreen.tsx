import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';
import blockingService, { BlockedUser } from '../../services/BlockingService';
import logger from '../../services/LoggingService';

interface BlockedUsersScreenProps {
  navigation: any;
}

const BlockedUsersScreen: React.FC<BlockedUsersScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingUsers, setUnblockingUsers] = useState(new Set<string>());

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    userAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 16,
    },
    userAvatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userAvatarText: {
      fontSize: 18,
      fontFamily: getSystemFont('bold'),
      color: '#ffffff',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      marginBottom: 4,
    },
    blockedDate: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
    unblockButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.accent,
      minWidth: 80,
      alignItems: 'center',
    },
    unblockButtonText: {
      fontSize: 14,
      fontFamily: getSystemFont('semiBold'),
      color: theme.accent,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoCard: {
      margin: 16,
      padding: 16,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.05)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    infoText: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.text,
      lineHeight: 20,
    },
  });

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const users = await blockingService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      logger.error('Failed to load blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const handleUnblockUser = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.blockedUserName}? They will be able to contact you and see your profile again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => unblockUser(user),
        }
      ]
    );
  };

  const unblockUser = async (user: BlockedUser) => {
    try {
      setUnblockingUsers(prev => new Set([...prev, user.blockedUserId]));
      
      const success = await blockingService.unblockUser(user.blockedUserId);
      
      if (success) {
        setBlockedUsers(prev => prev.filter(u => u.blockedUserId !== user.blockedUserId));
        Alert.alert('Success', `${user.blockedUserName} has been unblocked.`);
      } else {
        Alert.alert('Error', 'Failed to unblock user. Please try again.');
      }
    } catch (error) {
      logger.error('Failed to unblock user:', error);
      Alert.alert('Error', 'Failed to unblock user. Please try again.');
    } finally {
      setUnblockingUsers(prev => {
        const next = new Set(prev);
        next.delete(user.blockedUserId);
        return next;
      });
    }
  };

  const formatBlockedDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return 'Blocked yesterday';
      } else if (diffDays < 7) {
        return `Blocked ${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Blocked ${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return `Blocked on ${date.toLocaleDateString()}`;
      }
    } catch (error) {
      return 'Recently blocked';
    }
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblockingUsers.has(item.blockedUserId);

    return (
      <View style={dynamicStyles.userItem}>
        {item.blockedUserPhoto ? (
          <Image
            source={{ uri: item.blockedUserPhoto }}
            style={dynamicStyles.userAvatar}
            onError={() => {
              // Handle image load error
            }}
          />
        ) : (
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#fcd3aa']}
            style={dynamicStyles.userAvatarPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={dynamicStyles.userAvatarText}>
              {item.blockedUserName ? item.blockedUserName[0].toUpperCase() : 'U'}
            </Text>
          </LinearGradient>
        )}

        <View style={dynamicStyles.userInfo}>
          <Text style={dynamicStyles.userName}>{item.blockedUserName}</Text>
          <Text style={dynamicStyles.blockedDate}>
            {formatBlockedDate(item.blockedAt)}
          </Text>
        </View>

        <TouchableOpacity
          style={dynamicStyles.unblockButton}
          onPress={() => handleUnblockUser(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text style={dynamicStyles.unblockButtonText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.accent} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Blocked Users</Text>
          <View style={{ width: 48 }} />
        </View>
        
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[dynamicStyles.emptySubtitle, { marginTop: 16 }]}>
            Loading blocked users...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 48 }} />
      </View>

      {blockedUsers.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Ionicons
            name="ban-outline"
            size={64}
            color={theme.textSecondary}
            style={dynamicStyles.emptyIcon}
          />
          <Text style={dynamicStyles.emptyTitle}>No Blocked Users</Text>
          <Text style={dynamicStyles.emptySubtitle}>
            You haven't blocked anyone yet. Blocked users won't be able to contact you or see your profile.
          </Text>
        </View>
      ) : (
        <>
          {/* Info Card */}
          <View style={dynamicStyles.infoCard}>
            <Text style={dynamicStyles.infoText}>
              You have blocked {blockedUsers.length} user{blockedUsers.length !== 1 ? 's' : ''}. 
              Blocked users cannot see your profile, send you messages, or find you in search results.
            </Text>
          </View>

          {/* Blocked Users List */}
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id || item.blockedUserId}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.accent]}
                tintColor={theme.accent}
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
});

export default BlockedUsersScreen;