// src/components/geneology/WorkflowGenealogyScreen.tsx - Round Nodes with White Dots
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle, Line, Path } from 'react-native-svg';

import { Person } from './Person';
import { ComprehensivePersonModal } from './ComprehensivePersonModal';
import { EditPersonModal } from './EditPersonModal';
import { AddChildModal } from './AddChildModal';
import { AISuggestions } from './AISuggestions';
import { useFamilyTree } from './useFamilyTree';
import { getSystemFont, COLORS } from '../../config/constants';

const { width, height } = Dimensions.get('window');

interface WorkflowGenealogyScreenProps {
  navigation: any;
  route: any;
}

interface WorkflowNode {
  id: string;
  person: Person;
  x: number;
  y: number;
  generation: number;
}

interface Connection {
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const WorkflowGenealogyScreen: React.FC<WorkflowGenealogyScreenProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    familyTree,
    selectedPerson,
    setSelectedPerson,
    editingPerson,
    setEditingPerson,
    newPersonData,
    setNewPersonData,
    saveEditedPerson,
    addNewChild,
    addFamilyMemberFromModal,
    handleAddChild,
    getPersonsByGeneration,
    getTreeStats,
    loading: familyTreeLoading,
    error: familyTreeError,
  } = useFamilyTree(user);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.7); // Start zoomed out
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Form data for AddChildModal
  const [modalFormData, setModalFormData] = useState({
    firstName: '',
    lastName: '',
    yearOfBirth: '',
    placeOfBirth: '',
    gender: 'male' as 'male' | 'female',
    bio: '',
    profilePhoto: undefined as string | undefined,
    galleryImages: [] as string[],
  });

  // Initialize workflow nodes based on family tree data
  useEffect(() => {
    if (familyTree && Object.keys(familyTree).length > 0) {
      const people = Object.values(familyTree) as Person[];
      const nodes: WorkflowNode[] = [];
      const nodeConnections: Connection[] = [];
      
      // Calculate node positions in workflow style
      const generationGroups: { [key: number]: Person[] } = {};
      people.forEach(person => {
        if (!generationGroups[person.generation]) {
          generationGroups[person.generation] = [];
        }
        generationGroups[person.generation].push(person);
      });

      const generations = Object.keys(generationGroups).map(Number).sort((a, b) => a - b);
      const nodeSpacing = 200;
      const generationSpacing = 300;
      const canvasWidth = width * 4;
      const canvasHeight = height * 4;
      const startY = canvasHeight * 0.15; // Start at 15% from top of canvas

      generations.forEach((generation, genIndex) => {
        const generationPeople = generationGroups[generation];
        const totalWidth = (generationPeople.length - 1) * nodeSpacing;
        const startX = (canvasWidth - totalWidth) / 2; // Center horizontally in canvas

        generationPeople.forEach((person, personIndex) => {
          const x = startX + (personIndex * nodeSpacing);
          const y = startY + (genIndex * generationSpacing);
          
          const node: WorkflowNode = {
            id: person.id,
            person,
            x,
            y,
            generation: person.generation,
          };
          nodes.push(node);

          // Create connections to children
          if (person.children && person.children.length > 0) {
            person.children.forEach(childId => {
              const child = people.find(p => p.id === childId);
              if (child) {
                const childGenIndex = generations.indexOf(child.generation);
                if (childGenIndex > -1) {
                  const childGenerationPeople = generationGroups[child.generation];
                  const childPersonIndex = childGenerationPeople.findIndex(p => p.id === childId);
                  const childTotalWidth = (childGenerationPeople.length - 1) * nodeSpacing;
                  const childStartX = (canvasWidth - childTotalWidth) / 2;
                  const childX = childStartX + (childPersonIndex * nodeSpacing);
                  const childY = startY + (childGenIndex * generationSpacing);

                  nodeConnections.push({
                    from: person.id,
                    to: childId,
                    fromX: x,
                    fromY: y + 45, // Bottom of parent round node
                    toX: childX,
                    toY: childY - 45, // Top of child round node
                  });
                }
              }
            });
          }
        });
      });

      setWorkflowNodes(nodes);
      setConnections(nodeConnections);
    }
  }, [familyTree]);

  // Auto-center the view on the family tree when component mounts
  useEffect(() => {
    if (workflowNodes.length > 0 && scrollViewRef.current) {
      // Calculate the center of the family tree content
      const canvasWidth = width * 4;
      const canvasHeight = height * 4;
      
      // Center the view on the canvas
      const centerX = (canvasWidth - width) / 2;
      const centerY = (canvasHeight - height) / 2;
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: centerX,
          y: centerY,
          animated: true,
        });
      }, 100);
    }
  }, [workflowNodes]);

  const handlePersonPress = (person: Person) => {
    setSelectedPerson(person);
    setShowPersonModal(true);
  };

  const handleEditPress = (person: Person) => {
    setEditingPerson({ ...person });
    setShowPersonModal(false);
    setShowEditModal(true);
  };

  const handleAddChildPress = () => {
    setShowPersonModal(false);
    handleOpenAddMemberModal();
  };

  // Handle opening AddChildModal and reset form
  const handleOpenAddMemberModal = () => {
    setModalFormData({
      firstName: '',
      lastName: '',
      yearOfBirth: '',
      placeOfBirth: '',
      gender: 'male',
      bio: '',
      profilePhoto: undefined,
      galleryImages: [],
    });
    setShowAddChildModal(true);
  };

  // Handle form submission from AddChildModal
  const handleAddMemberSubmit = async (data: typeof modalFormData) => {
    const success = await addFamilyMemberFromModal(data, selectedPerson);
    if (success) {
      setShowAddChildModal(false);
      setModalFormData({
        firstName: '',
        lastName: '',
        yearOfBirth: '',
        placeOfBirth: '',
        gender: 'male',
        bio: '',
        profilePhoto: undefined,
        galleryImages: [],
      });
    }
  };

  // Handle share functionality
  const handleShare = () => {
    Alert.alert(
      'Share Family Tree',
      'How would you like to share your family tree?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Link', onPress: handleShareLink },
        { text: 'Export as Image', onPress: handleExportImage },
        { text: 'Share Summary', onPress: handleShareSummary },
      ]
    );
  };

  const handleShareLink = async () => {
    try {
      const treeStats = await getTreeStats();
      const shareMessage = `Check out my family tree! 🌳\n\nI've been documenting my family heritage with ${treeStats?.totalMembers || 0} family members across ${treeStats?.generations || 0} generations.\n\nJoin me in preserving our family history!`;
      
      const shareOptions = {
        message: shareMessage,
        url: 'https://yofam.app', // Replace with actual app URL
        title: 'My Family Tree',
      };

      if (Platform.OS === 'ios') {
        await Share.share(shareOptions);
      } else {
        await Share.share({ message: `${shareMessage}\n\nhttps://yofam.app` });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share family tree');
    }
  };

  const handleExportImage = () => {
    // TODO: Implement screenshot/export functionality
    Alert.alert(
      'Export Feature',
      'Image export functionality will be available in the next update. You can currently share a link or text summary of your family tree.',
      [{ text: 'OK' }]
    );
  };

  const handleShareSummary = async () => {
    try {
      const treeStats = await getTreeStats();
      const members = Object.values(familyTree);
      const userMember = members.find(m => m.isCurrentUser);
      
      let summary = `🌳 ${userMember?.name || user?.name || 'My'} Family Tree Summary\n\n`;
      summary += `📊 Statistics:\n`;
      summary += `• ${treeStats?.totalMembers || members.length} family members\n`;
      summary += `• ${treeStats?.generations || 1} generations documented\n`;
      
      if (treeStats?.withPhotos) {
        summary += `• ${treeStats.withPhotos} members with photos\n`;
      }
      
      summary += `\n👥 Recent additions:\n`;
      
      // Show newest members (last 3)
      const recentMembers = members
        .filter(m => !m.isCurrentUser)
        .slice(-3)
        .map(m => `• ${m.name}${m.birthDate ? ` (${new Date(m.birthDate).getFullYear()})` : ''}`)
        .join('\n');
      
      summary += recentMembers || '• No recent additions';
      summary += `\n\nPreserving family history, one story at a time! 💝`;

      await Share.share({
        message: summary,
        title: 'Family Tree Summary'
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      Alert.alert('Error', 'Failed to generate family tree summary');
    }
  };

  // Handle settings
  const handleSettings = () => {
    Alert.alert(
      'Family Tree Settings',
      'Settings functionality coming soon! You\'ll be able to:\n\n• Privacy & sharing settings\n• Export options\n• Display preferences\n• Collaboration settings',
      [{ text: 'OK' }]
    );
  };

  // Render round image nodes
  const renderWorkflowNode = (node: WorkflowNode) => {
    const isCurrentUser = node.person.id === user?._id;
    const isAlive = node.person.isAlive !== false;
    const birthYear = node.person.dateOfBirth ? new Date(node.person.dateOfBirth).getFullYear() : null;
    const deathYear = node.person.dateOfDeath ? new Date(node.person.dateOfDeath).getFullYear() : null;
    const yearText = birthYear ? (deathYear ? `${birthYear} - ${deathYear}` : `${birthYear} - Present`) : 'Unknown';
    
    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.roundNode,
          { 
            position: 'absolute',
            left: node.x - 50,
            top: node.y - 50,
          },
        ]}
        onPress={() => handlePersonPress(node.person)}
      >
        {/* Round image container */}
        <View style={[
          styles.imageContainer,
          isCurrentUser && styles.currentUserBorder,
          !isAlive && styles.deceasedBorder
        ]}>
          {node.person.photo ? (
            <Image 
              source={{ uri: node.person.photo }} 
              style={styles.personImage}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: node.person.gender === 'male' ? '#4A90E2' : '#E24A90' }]}>
              <Text style={styles.initials}>
                {node.person.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          
          {/* Connection points */}
          <View style={[styles.connectionPoint, styles.inputPoint]} />
          {node.person.children && node.person.children.length > 0 && (
            <View style={[styles.connectionPoint, styles.outputPoint]} />
          )}
          
          {/* Status indicators */}
          {isCurrentUser && (
            <View style={styles.currentUserIndicator}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}
          
          {node.person.isAIMatched && (
            <View style={styles.aiIndicator}>
              <Ionicons name="sparkles" size={10} color="#FF6B35" />
            </View>
          )}
        </View>
        
        {/* Name and year below image */}
        <View style={styles.nodeInfo}>
          <Text style={styles.personName} numberOfLines={1}>
            {node.person.name}
          </Text>
          <Text style={styles.personYear}>
            {yearText}
          </Text>
        </View>
        
        {/* Plus buttons for adding family members */}
        <View style={styles.nodeActions}>
          {/* Add Parent Button */}
          <TouchableOpacity
            style={[styles.plusButton, styles.plusButtonTop]}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedPerson(node.person);
              Alert.alert(
                'Add Family Member',
                'What would you like to add?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Add Parent', onPress: handleOpenAddMemberModal },
                  { text: 'Add Spouse', onPress: handleOpenAddMemberModal },
                ]
              );
            }}
          >
            <Ionicons name="add" size={12} color="#ffffff" />
          </TouchableOpacity>
          
          {/* Add Child Button */}
          <TouchableOpacity
            style={[styles.plusButton, styles.plusButtonBottom]}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedPerson(node.person);
              handleAddChild(node.person.id);
            }}
          >
            <Ionicons name="add" size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render workflow-style connections
  const renderConnections = () => {
    if (connections.length === 0) return null;

    return (
      <Svg 
        style={StyleSheet.absoluteFillObject}
        width={width * 4}
        height={height * 4}
      >
        {connections.map((connection, index) => {
          const controlPointOffset = 60;
          const midY = (connection.fromY + connection.toY) / 2;
          
          return (
            <Path
              key={`${connection.from}-${connection.to}-${index}`}
              d={`
                M ${connection.fromX} ${connection.fromY}
                L ${connection.fromX} ${midY - controlPointOffset}
                Q ${connection.fromX} ${midY} ${(connection.fromX + connection.toX) / 2} ${midY}
                Q ${connection.toX} ${midY} ${connection.toX} ${midY + controlPointOffset}
                L ${connection.toX} ${connection.toY}
              `}
              stroke={COLORS.textSecondary}
              strokeWidth="2"
              fill="none"
              opacity={0.8}
              strokeDasharray="0"
            />
          );
        })}
      </Svg>
    );
  };

  // Generate white dotted pattern for background - much larger canvas
  const renderDottedPattern = () => {
    const dots = [];
    const dotSpacing = 20;
    const canvasWidth = width * 4; // Much larger canvas
    const canvasHeight = height * 4;
    
    for (let x = 0; x < canvasWidth; x += dotSpacing) {
      for (let y = 0; y < canvasHeight; y += dotSpacing) {
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r="3"
            fill="#ffffff"
            opacity={1}
          />
        );
      }
    }

    return (
      <Svg 
        style={StyleSheet.absoluteFillObject}
        width={canvasWidth}
        height={canvasHeight}
      >
        {dots}
      </Svg>
    );
  };

  const stats = getTreeStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header - n8n style */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Family Tree Workflow</Text>
            {stats && (
              <Text style={styles.headerSubtitle}>
                {stats.totalMembers} members • {stats.generations} generations
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Workflow Canvas */}
      <View style={styles.workflowCanvas}>
        {workflowNodes.length === 0 ? (
          // Empty state - show Begin Family Tree button
          <View style={styles.emptyState}>
            <View style={styles.emptyStateContent}>
              <Ionicons name="people-outline" size={80} color="#888" />
              <Text style={styles.emptyTitle}>Begin Your Family Tree</Text>
              <Text style={styles.emptySubtitle}>
                Start documenting your family heritage and discover your roots
              </Text>
              <TouchableOpacity
                style={styles.beginTreeButton}
                onPress={handleOpenAddMemberModal}
              >
                <Ionicons name="add-circle" size={24} color="#ffffff" />
                <Text style={styles.beginTreeText}>Create Family Tree</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Family tree canvas
          <ScrollView 
            ref={scrollViewRef}
            style={styles.canvasScrollView}
            contentContainerStyle={styles.canvasContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            maximumZoomScale={2}
            minimumZoomScale={0.3}
            zoomEnabled={true}
            directionalLockEnabled={false}
            scrollEnabled={true}
          >
            {/* Dotted background */}
            {renderDottedPattern()}
            
            {/* Connections */}
            {renderConnections()}
            
            {/* Workflow nodes */}
            <View style={styles.nodesContainer}>
              {workflowNodes.map(node => renderWorkflowNode(node))}
            </View>
          </ScrollView>
        )}

        {/* Workflow controls - bottom right */}
        <View style={styles.workflowControls}>
          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="add" size={16} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="remove" size={16} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="scan-outline" size={16} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Minimap */}
          <View style={styles.minimap}>
            <Text style={styles.minimapTitle}>Overview</Text>
            <View style={styles.minimapCanvas}>
              {/* Simplified minimap representation */}
              {workflowNodes.slice(0, 8).map((node, index) => (
                <View 
                  key={node.id}
                  style={[
                    styles.minimapNode,
                    {
                      left: (node.x / (width * 4)) * 60,
                      top: (node.y / (height * 4)) * 40,
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Modals */}
      <ComprehensivePersonModal
        visible={showPersonModal}
        person={selectedPerson}
        onClose={() => setShowPersonModal(false)}
        onEdit={handleEditPress}
        onAddChild={handleAddChildPress}
      />

      <EditPersonModal
        visible={showEditModal}
        person={editingPerson}
        onClose={() => setShowEditModal(false)}
        onSave={saveEditedPerson}
      />

      <AddChildModal
        visible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAdd={handleAddMemberSubmit}
        personData={modalFormData}
        onDataChange={setModalFormData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workflowCanvas: {
    flex: 1,
    position: 'relative',
  },
  canvasScrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  canvasContent: {
    width: width * 4,
    height: height * 4,
    position: 'relative',
  },
  nodesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roundNode: {
    alignItems: 'center',
    width: 100,
    height: 120,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: COLORS.textSecondary,
  },
  currentUserBorder: {
    borderColor: COLORS.primary,
    borderWidth: 4,
  },
  deceasedBorder: {
    borderColor: COLORS.textSecondary,
    opacity: 0.7,
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
  },
  nodeInfo: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  personName: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  personYear: {
    fontSize: 10,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  currentUserIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  aiIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  connectionPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#1a1a2e',
    position: 'absolute',
  },
  inputPoint: {
    top: -5,
    left: '50%',
    marginLeft: -5,
  },
  outputPoint: {
    bottom: -5,
    left: '50%',
    marginLeft: -5,
  },
  aiBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNodeButton: {
    position: 'absolute',
    bottom: 100,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  addNodeText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#888',
    marginLeft: 4,
  },
  workflowControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  zoomControls: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  controlButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  minimap: {
    width: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  minimapTitle: {
    fontSize: 10,
    fontFamily: getSystemFont('medium'),
    color: '#888',
    marginBottom: 4,
  },
  minimapCanvas: {
    width: 64,
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    position: 'relative',
  },
  minimapNode: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  beginTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  beginTreeText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  // Plus button styles
  nodeActions: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: -60,
  },
  plusButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
    opacity: 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  plusButtonTop: {
    top: -12,
    left: '50%',
    marginLeft: -12,
  },
  plusButtonBottom: {
    bottom: -12,
    left: '50%',
    marginLeft: -12,
  },
});

export default WorkflowGenealogyScreen;