import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

interface FamilyTreeSyncProps {
  familyTree: any;
  onSync: (data: any) => Promise<void>;
  onExport: () => Promise<string | null>;
  onImport: (data: string) => Promise<boolean>;
  visible: boolean;
  onClose: () => void;
}

export const FamilyTreeSync: React.FC<FamilyTreeSyncProps> = ({
  familyTree,
  onSync,
  onExport,
  onImport,
  visible,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState([
    { id: '1', name: 'Ahmad Al-Mansouri', email: 'ahmad@example.com', role: 'Editor', active: true },
    { id: '2', name: 'Fatima Al-Mansouri', email: 'fatima@example.com', role: 'Viewer', active: false },
  ]);

  // Simulate real-time sync status
  useEffect(() => {
    if (visible) {
      // Mock last sync time
      setLastSync(new Date(Date.now() - Math.random() * 3600000)); // Random time in last hour
    }
  }, [visible]);

  const handleSync = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onSync(familyTree);
      setSyncStatus('success');
      setLastSync(new Date());
      
      Alert.alert('Success', 'Family tree synchronized successfully!');
    } catch (error) {
      setSyncStatus('error');
      Alert.alert('Error', 'Failed to synchronize family tree. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      const exportData = await onExport();
      if (exportData) {
        // In a real app, you might save to device storage or share
        Alert.alert(
          'Export Complete',
          'Family tree data has been exported. You can now share or backup this data.',
          [
            { text: 'Copy to Clipboard', onPress: () => {
              // Implement clipboard copy
              console.log('Copying to clipboard:', exportData.substring(0, 100) + '...');
            }},
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export family tree data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Family Tree',
      'Paste your family tree data (JSON format):',
      async (data) => {
        if (data) {
          setIsLoading(true);
          const success = await onImport(data);
          setIsLoading(false);
          
          if (success) {
            Alert.alert('Success', 'Family tree imported successfully!');
            onClose();
          } else {
            Alert.alert('Error', 'Invalid data format. Please check and try again.');
          }
        }
      },
      'plain-text'
    );
  };

  const handleInviteCollaborator = () => {
    Alert.prompt(
      'Invite Collaborator',
      'Enter email address:',
      (email) => {
        if (email) {
          Alert.alert(
            'Invite Sent',
            `Invitation sent to ${email}. They will be able to view and contribute to your family tree.`
          );
        }
      },
      'plain-text'
    );
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.round(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return '#F59E0B';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return 'sync';
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'cloud-upload';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sync & Collaborate</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sync Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync Status</Text>
              
              <View style={styles.syncStatusCard}>
                <View style={styles.syncStatusHeader}>
                  <View style={styles.syncStatusInfo}>
                    <Ionicons 
                      name={getSyncStatusIcon() as any}
                      size={20} 
                      color={getSyncStatusColor()} 
                    />
                    <Text style={[styles.syncStatusText, { color: getSyncStatusColor() }]}>
                      {syncStatus === 'idle' && 'Ready to sync'}
                      {syncStatus === 'syncing' && 'Syncing...'}
                      {syncStatus === 'success' && 'Up to date'}
                      {syncStatus === 'error' && 'Sync failed'}
                    </Text>
                  </View>
                  
                  {isLoading && syncStatus === 'syncing' && (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  )}
                </View>
                
                <Text style={styles.lastSyncText}>
                  Last sync: {formatLastSync(lastSync)}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.syncButton, isLoading && styles.disabledButton]}
                  onPress={handleSync}
                  disabled={isLoading}
                >
                  <Ionicons name="sync" size={16} color="#FFFFFF" />
                  <Text style={styles.syncButtonText}>
                    {isLoading ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Collaboration */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Collaborators</Text>
                <TouchableOpacity 
                  style={styles.inviteButton}
                  onPress={handleInviteCollaborator}
                >
                  <Ionicons name="person-add" size={16} color="#4A90E2" />
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              </View>
              
              {collaborators.map((collaborator) => (
                <View key={collaborator.id} style={styles.collaboratorCard}>
                  <View style={styles.collaboratorInfo}>
                    <View style={styles.collaboratorAvatar}>
                      <Text style={styles.collaboratorInitials}>
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    
                    <View style={styles.collaboratorDetails}>
                      <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                      <Text style={styles.collaboratorEmail}>{collaborator.email}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.collaboratorStatus}>
                    <Text style={styles.collaboratorRole}>{collaborator.role}</Text>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: collaborator.active ? '#10B981' : '#9CA3AF' }
                    ]} />
                  </View>
                </View>
              ))}
            </View>

            {/* Data Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Management</Text>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
                <Ionicons name="download" size={20} color="#4A90E2" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Export Tree</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Save a backup of your family tree data
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
                <Ionicons name="cloud-upload" size={20} color="#4A90E2" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Import Tree</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    Load family tree data from backup
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Tree Statistics */}
            {familyTree && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tree Statistics</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{familyTree.members?.length || 0}</Text>
                    <Text style={styles.statLabel}>Family Members</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {familyTree.members?.filter((m: any) => m.photo).length || 0}
                    </Text>
                    <Text style={styles.statLabel}>With Photos</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {familyTree.members?.filter((m: any) => m.isAIMatched).length || 0}
                    </Text>
                    <Text style={styles.statLabel}>AI Matched</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{familyTree.version || 1}</Text>
                    <Text style={styles.statLabel}>Version</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#333',
    marginBottom: 16,
  },
  syncStatusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  syncStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncStatusText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
  },
  lastSyncText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#666',
    marginBottom: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  syncButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inviteButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#4A90E2',
  },
  collaboratorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  collaboratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  collaboratorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collaboratorInitials: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#FFFFFF',
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#333',
  },
  collaboratorEmail: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#666',
  },
  collaboratorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collaboratorRole: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#666',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#333',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#666',
    textAlign: 'center',
  },
});