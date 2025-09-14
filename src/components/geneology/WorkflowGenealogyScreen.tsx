// src/components/geneology/WorkflowGenealogyScreen.tsx - Round Nodes with White Dots
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  TextInput,
  Modal,
  FlatList,
  PanResponder,
} from 'react-native';
// Removed animated imports to fix hooks violation
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Person } from './Person';
import { ComprehensivePersonModal } from './ComprehensivePersonModal';
import { EditPersonModal } from './EditPersonModal';
import { AddChildModal } from './AddChildModal';
import { AISuggestions } from './AISuggestions';
import { useFamilyTree } from './useFamilyTree';
import { getSystemFont, COLORS } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Utility functions to reduce code duplication
const isValidConnection = (connection: any): boolean => {
  return connection && 
         typeof connection.fromX === 'number' && !isNaN(connection.fromX) &&
         typeof connection.fromY === 'number' && !isNaN(connection.fromY) &&
         typeof connection.toX === 'number' && !isNaN(connection.toX) &&
         typeof connection.toY === 'number' && !isNaN(connection.toY) &&
         connection.type && 
         connection.from && 
         connection.to;
};

const isValidNode = (node: any): boolean => {
  return node && 
         node.person && 
         typeof node.x === 'number' && !isNaN(node.x) &&
         typeof node.y === 'number' && !isNaN(node.y);
};

const clampZoomLevel = (zoom: number): number => {
  return Math.max(0.1, Math.min(3.0, zoom));
};

// Layout and timing constants
const LAYOUT_CONSTANTS = {
  CACHE_EXPIRY_MINUTES: 10,
  AUTO_SAVE_DELAY_MS: 2000,
  MIN_NODE_SPACING: 200,
  MIN_GENERATION_SPACING: 350,
  CANVAS_TOP_MARGIN: 0.1, // 10% from top
  MIN_HORIZONTAL_MARGIN: 100,
  MAX_DATA_SIZE_MB: 5,
  BACKUP_NODE_LIMIT: 50,
  SVG_TEXT_OFFSET: 10,
  SVG_FONT_SIZE: 10,
  BUTTON_SIZE: 20,
} as const;

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
  type: 'parent' | 'spouse' | 'sibling';
  marriageInfo?: {
    id: string;
    marriageDate?: string;
    divorceDate?: string;
    isCurrentSpouse: boolean;
  };
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
    deleteFamilyMember,
    refreshFamilyTree,
    loading: familyTreeLoading,
    error: familyTreeError,
    currentTreeId,
  } = useFamilyTree(user);

  // Get tree ID from hook - this is the actual family tree ID
  const treeId = currentTreeId;

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.7); // Start zoomed out
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [selectedPersonForPhotos, setSelectedPersonForPhotos] = useState<Person | null>(null);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Function to determine if user can delete a family member
  const canUserDelete = (person: Person): boolean => {
    if (!user?._id) return false;
    
    // Users cannot delete themselves
    if (person.isCurrentUser) return false;
    
    // Users can delete family members they created
    if (person.userId === user._id || person.createdBy === user._id) {
      return true;
    }
    
    // Users can delete if they have edit permissions (primary claimer, etc.)
    // This would need to be enhanced with actual permission data from backend
    if (person.isEditable === true && person.userId === user._id) {
      return true;
    }
    
    // For now, allow deletion of family members added to their own family tree
    // In a more sophisticated system, this would check actual ownership/permissions
    return false;
  };

  const [selectedPersonForDocs, setSelectedPersonForDocs] = useState<Person | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Form data for AddChildModal
  const [modalFormData, setModalFormData] = useState({
    firstName: '',
    lastName: '',
    yearOfBirth: '',
    placeOfBirth: '',
    gender: 'male' as 'male' | 'female',
    relationshipType: 'child' as 'child' | 'parent' | 'sibling' | 'spouse',
    bio: '',
    profilePhoto: undefined as string | undefined,
    galleryImages: [] as string[],
  });

  // Memoize SVG connections rendering for performance with error handling
  const memoizedConnectionsJSX = useMemo(() => {
    console.log('🔗 Rendering connections, count:', connections.length);

    if (!Array.isArray(connections) || connections.length === 0) {
      console.log('❌ No connections to render');
      return null;
    }

    // Safety: Limit connections to prevent crashes
    if (connections.length > 50) {
      console.warn('⚠️ Too many connections for stability, limiting to 50');
      return null;
    }

    try {
      return connections.filter(isValidConnection).map((connection, index) => {
        const startX = connection.fromX;
        const startY = connection.fromY;
        const endX = connection.toX;
        const endY = connection.toY;
        
        console.log(`🔗 Connection ${index}:`, {
          from: connection.from,
          to: connection.to,
          type: connection.type,
          startX,
          startY,
          endX,
          endY
        });
        
        let pathData, strokeColor, strokeWidth, strokeDasharray = "0";
      
      if (connection.type === 'spouse') {
        pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
        strokeColor = connection.marriageInfo?.isCurrentSpouse ? "#e91e63" : "#9c27b0";
        strokeWidth = "3";
        if (!connection.marriageInfo?.isCurrentSpouse && connection.marriageInfo?.divorceDate) {
          strokeDasharray = "8,4";
        }
      } else if (connection.type === 'sibling') {
        pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
        strokeColor = "#00bcd4";
        strokeWidth = "2.5";
        strokeDasharray = "5,5";
      } else {
        const controlPointOffset = Math.abs(endY - startY) * 0.4;
        pathData = `M ${startX} ${startY} C ${startX} ${startY + controlPointOffset} ${endX} ${endY - controlPointOffset} ${endX} ${endY}`;
        strokeColor = "#2563eb";
        strokeWidth = "2";
      }
      
      return (
        <React.Fragment key={`connection-${index}`}>
          <Path
            d={pathData}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            opacity={0.8}
          />
          <Circle cx={startX} cy={startY} r="3" fill={strokeColor} opacity={0.7} />
          <Circle cx={endX} cy={endY} r="3" fill={strokeColor} opacity={0.7} />
          
          {connection.type === 'spouse' && (
            <Circle
              cx={(startX + endX) / 2}
              cy={(startY + endY) / 2}
              r="4"
              fill="#FFB6C1"
              opacity={0.8}
            />
          )}
          {connection.type === 'sibling' && (
            <Circle
              cx={(startX + endX) / 2}
              cy={(startY + endY) / 2}
              r="3"
              fill="#87CEEB"
              opacity={0.8}
            />
          )}
        </React.Fragment>
      );
    });
    } catch (error) {
      console.error('Error rendering memoized connections:', error);
      return null; // Return null on error to prevent crashes
    }
  }, [connections]);

  // Save connections to AsyncStorage for persistence
  const saveConnectionsToStorage = async (nodes: WorkflowNode[], connections: Connection[]) => {
    if (treeId && nodes.length > 0) {
      try {
        const cacheKey = `familyTree_connections_${treeId}`;
        const dataToCache = {
          nodes,
          connections,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        console.log('💾 Saved connections to storage for tree:', treeId, 'nodes:', nodes.length, 'connections:', connections.length);
      } catch (error) {
        console.error('Error saving connections to storage:', error);
      }
    }
  };

  // Load connections from AsyncStorage
  const loadConnectionsFromStorage = async (): Promise<{ nodes: WorkflowNode[]; connections: Connection[] } | null> => {
    if (treeId) {
      try {
        const cacheKey = `familyTree_connections_${treeId}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Only use cached data if it's less than configured minutes old
          if (Date.now() - parsed.timestamp < LAYOUT_CONSTANTS.CACHE_EXPIRY_MINUTES * 60 * 1000) {
            console.log('📱 Loaded connections from storage for tree:', treeId, 'nodes:', parsed.nodes.length, 'connections:', parsed.connections.length);
            return { nodes: parsed.nodes, connections: parsed.connections };
          } else {
            console.log('🗑️ Cached connections expired, will regenerate');
          }
        }
      } catch (error) {
        console.error('Error loading connections from storage:', error);
      }
    }
    return null;
  };

  // Initialize workflow nodes based on family tree data
  useEffect(() => {
    const processFamilyTreeData = async () => {
      console.log('🔄 Family tree useEffect triggered:', {
        familyTreeKeys: familyTree ? Object.keys(familyTree).length : 0,
        hasData: !!(familyTree && Object.keys(familyTree).length > 0),
        loading: familyTreeLoading
      });
      
      if (familyTree && Object.keys(familyTree).length > 0) {
        try {
          const people = Object.values(familyTree).filter(person => person && person.id) as Person[];
          console.log('👥 Processing people for connections:', people.length);

          // First, try to load cached connections and validate they match current data
          const cachedData = await loadConnectionsFromStorage();
          if (cachedData && cachedData.nodes.length > 0) {
            // Validate cached data matches current family tree
            const cachedNodeIds = new Set(cachedData.nodes.map(n => n.id));
            const currentPeopleIds = new Set(people.map(p => p.id));
            const idsMatch = cachedNodeIds.size === currentPeopleIds.size && 
                           [...cachedNodeIds].every(id => currentPeopleIds.has(id));
            
            if (idsMatch) {
              console.log('✅ Using cached connections - data matches');
              setWorkflowNodes(cachedData.nodes);
              setConnections(cachedData.connections);
              return;
            } else {
              console.log('🗑️ Cache invalidated - people data has changed');
            }
          }
        
          if (people.length === 0) {
          console.log('⚠️ WorkflowGenealogyScreen: No valid people found in familyTree');
          setWorkflowNodes([]);
          setConnections([]);
          return;
        }
        
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
      const canvasWidth = width * 3; // Reduced from 4x to 2x
      const canvasHeight = height * 3; // Reduced from 4x to 2x
      
      // Improved spacing calculations
      const maxPeopleInGeneration = Math.max(...Object.values(generationGroups).map(gen => gen.length));
      const baseNodeSpacing = Math.max(LAYOUT_CONSTANTS.MIN_NODE_SPACING, canvasWidth / (maxPeopleInGeneration + 2)); // Adaptive spacing
      const generationSpacing = Math.min(LAYOUT_CONSTANTS.MIN_GENERATION_SPACING, canvasHeight / (generations.length + 1)); // Adaptive generation spacing
      const startY = canvasHeight * LAYOUT_CONSTANTS.CANVAS_TOP_MARGIN; // Start at configured % from top

      generations.forEach((generation, genIndex) => {
        const generationPeople = generationGroups[generation];
        
        // Calculate dynamic spacing for this specific generation
        const peopleInThisGen = generationPeople.length;
        const nodeSpacing = peopleInThisGen === 1 ? 0 : Math.min(baseNodeSpacing, (canvasWidth * 0.8) / (peopleInThisGen - 1));
        const totalWidth = peopleInThisGen === 1 ? 0 : (peopleInThisGen - 1) * nodeSpacing;
        const startX = Math.max(LAYOUT_CONSTANTS.MIN_HORIZONTAL_MARGIN, (canvasWidth - totalWidth) / 2); // Center horizontally in canvas with minimum margin

        generationPeople.forEach((person, personIndex) => {
          let x = startX + (personIndex * nodeSpacing);
          let y = startY + (genIndex * generationSpacing);
          
          // Add deterministic organic variation based on person ID to avoid perfect grid
          // This ensures consistent positioning across renders while still looking natural
          const variation = 30; // pixels of variation
          const seed = person.id.length + (person.id.charCodeAt(0) || 0); // Use ID as seed
          const offsetX = ((seed * 17) % 100 - 50) / 50 * variation; // Normalize to [-variation, variation]
          const offsetY = ((seed * 23) % 100 - 50) / 50 * variation;
          x += offsetX;
          y += offsetY;
          
          const node: WorkflowNode = {
            id: person.id,
            person,
            x,
            y,
            generation: person.generation,
          };
          nodes.push(node);

          // Note: Connections will be created after all nodes are positioned
        });
      });

        // SINGLE, RELIABLE CONNECTION GENERATION SYSTEM
        console.log(`🔗 Creating connections for ${people.length} people with ${nodes.length} nodes`);
        const createdConnections = new Set<string>();
        
        
        // 1. PARENT-CHILD CONNECTIONS (highest priority - always create these)
        people.forEach(person => {
          const personNode = nodes.find(n => n.id === person.id);
          if (!personNode) {
            console.log(`⚠️ No node found for person ${person.name} (${person.id})`);
            return;
          }
          
          console.log(`🔍 Processing ${person.name}:`, {
            children: person.children,
            parents: person.parents,
            siblings: person.siblings,
            spouse: person.spouse
          });
          
          // Create connections from parent to children
          if (person.children && Array.isArray(person.children) && person.children.length > 0) {
            console.log(`👶 ${person.name} has ${person.children.length} children:`, person.children);
            person.children.forEach(childId => {
              const connectionKey = `parent-${person.id}-${childId}`;
              if (!createdConnections.has(connectionKey)) {
                const childNode = nodes.find(n => n.id === childId);
                if (childNode) {
                  nodeConnections.push({
                    from: person.id,
                    to: childId,
                    fromX: personNode.x,
                    fromY: personNode.y + 50,
                    toX: childNode.x,
                    toY: childNode.y - 50,
                    type: 'parent',
                  });
                  createdConnections.add(connectionKey);
                  console.log(`✅ Parent-Child: ${person.name} -> ${people.find(p => p.id === childId)?.name || childId}`);
                } else {
                  console.log(`⚠️ Child node not found for ID: ${childId}`);
                }
              }
            });
          }
          
          // Also create from child to parent (reverse check for data completeness)
          if (person.parents && Array.isArray(person.parents) && person.parents.length > 0) {
            console.log(`👨‍👩‍👦‍👦 ${person.name} has ${person.parents.length} parents:`, person.parents);
            person.parents.forEach(parentId => {
              const connectionKey = `parent-${parentId}-${person.id}`;
              if (!createdConnections.has(connectionKey)) {
                const parentNode = nodes.find(n => n.id === parentId);
                if (parentNode) {
                  nodeConnections.push({
                    from: parentId,
                    to: person.id,
                    fromX: parentNode.x,
                    fromY: parentNode.y + 50,
                    toX: personNode.x,
                    toY: personNode.y - 50,
                    type: 'parent',
                  });
                  createdConnections.add(connectionKey);
                  console.log(`✅ Child-Parent: ${people.find(p => p.id === parentId)?.name || parentId} -> ${person.name}`);
                } else {
                  console.log(`⚠️ Parent node not found for ID: ${parentId}`);
                }
              }
            });
          }
        });
        
        // 2. SPOUSE CONNECTIONS
        people.forEach(person => {
          const personNode = nodes.find(n => n.id === person.id);
          if (!personNode) return;
          
          const allSpouses = [];
          
          // Legacy single spouse
          if (person.spouse) {
            allSpouses.push({ id: person.spouse, isCurrentSpouse: true });
            console.log(`💑 ${person.name} has spouse: ${person.spouse}`);
          }
          
          // Modern multiple spouses
          if (person.spouses && Array.isArray(person.spouses)) {
            allSpouses.push(...person.spouses);
            console.log(`💑 ${person.name} has ${person.spouses.length} spouses:`, person.spouses);
          }
          
          allSpouses.forEach((spouseInfo) => {
            const spouseId = typeof spouseInfo === 'string' ? spouseInfo : spouseInfo.id;
            const connectionKey = `spouse-${person.id}-${spouseId}`;
            const reverseKey = `spouse-${spouseId}-${person.id}`;
            
            if (!createdConnections.has(connectionKey) && !createdConnections.has(reverseKey)) {
              const spouseNode = nodes.find(n => n.id === spouseId);
              if (spouseNode) {
                nodeConnections.push({
                  from: person.id,
                  to: spouseId,
                  fromX: personNode.x + 50,
                  fromY: personNode.y,
                  toX: spouseNode.x - 50,
                  toY: spouseNode.y,
                  type: 'spouse',
                  marriageInfo: spouseInfo,
                });
                createdConnections.add(connectionKey);
                console.log(`✅ Spouse: ${person.name} ↔ ${people.find(p => p.id === spouseId)?.name || spouseId}`);
              } else {
                console.log(`⚠️ Spouse node not found for ID: ${spouseId}`);
              }
            }
          });
        });
        
        // 3. SIBLING CONNECTIONS
        people.forEach(person => {
          const personNode = nodes.find(n => n.id === person.id);
          if (!personNode) return;
          
          if (person.siblings && Array.isArray(person.siblings) && person.siblings.length > 0) {
            console.log(`👫 ${person.name} has ${person.siblings.length} siblings:`, person.siblings);
            
            person.siblings.forEach(siblingId => {
              const connectionKey = `sibling-${person.id}-${siblingId}`;
              const reverseKey = `sibling-${siblingId}-${person.id}`;
              
              if (!createdConnections.has(connectionKey) && !createdConnections.has(reverseKey)) {
                const siblingNode = nodes.find(n => n.id === siblingId);
                if (siblingNode && personNode.generation === siblingNode.generation) {
                  nodeConnections.push({
                    from: person.id,
                    to: siblingId,
                    fromX: personNode.x + 25,
                    fromY: personNode.y,
                    toX: siblingNode.x - 25,
                    toY: siblingNode.y,
                    type: 'sibling',
                  });
                  createdConnections.add(connectionKey);
                  console.log(`✅ Sibling: ${person.name} ↔ ${people.find(p => p.id === siblingId)?.name || siblingId}`);
                } else if (!siblingNode) {
                  console.log(`⚠️ Sibling node not found for ID: ${siblingId}`);
                } else {
                  console.log(`⚠️ Sibling generation mismatch: ${person.name} (gen ${personNode.generation}) vs ${people.find(p => p.id === siblingId)?.name} (gen ${siblingNode.generation})`);
                }
              }
            });
          }
        });
        
        console.log(`🎯 FINAL RESULT: Created ${nodeConnections.length} connections for ${people.length} people`);
        nodeConnections.forEach(conn => {
          const fromName = people.find(p => p.id === conn.from)?.name || conn.from;
          const toName = people.find(p => p.id === conn.to)?.name || conn.to;
          console.log(`   ${conn.type}: ${fromName} → ${toName}`);
        });

        // Validate connections before setting state
        const nodeIds = new Set(nodes.map(n => n.id));
        const validConnections = nodeConnections.filter(conn => {
          const isValid = nodeIds.has(conn.from) && nodeIds.has(conn.to);
          if (!isValid) {
            console.warn(`⚠️ Invalid connection removed: ${conn.from} -> ${conn.to} (missing nodes)`);
          }
          return isValid;
        });

        console.log('🔗 Setting connections state:', validConnections.length, 'valid out of', nodeConnections.length, 'total');
        setWorkflowNodes(nodes);
        setConnections(validConnections);
        
        // Save to storage for persistence (use validated connections)
        await saveConnectionsToStorage(nodes, validConnections);
        
        // Add a small delay to log the final state
        setTimeout(() => {
          console.log('📊 Final state set - Nodes:', nodes.length, 'Connections:', validConnections.length);
        }, 100);
        
        console.log('WorkflowGenealogyScreen: Created', nodes.length, 'nodes and', nodeConnections.length, 'connections');
        console.log('People data:', people.map(p => ({ id: p.id, name: p.name, children: p.children, parents: p.parents })));
      } catch (error) {
        console.error('WorkflowGenealogyScreen: Error processing family tree data:', error);
        setWorkflowNodes([]);
        setConnections([]);
      }
    } else if (!familyTreeLoading) {
      // Only clear nodes and connections if we're not currently loading
      // This prevents clearing during app startup when data is still loading
      console.log('❌ No family tree data available and not loading, clearing nodes and connections');
      setWorkflowNodes([]);
      setConnections([]);
      } else {
        console.log('⏳ Family tree is still loading, keeping existing connections');
      }
    };

    processFamilyTreeData();
  }, [familyTree, familyTreeLoading]);



  // Save/Load functionality
  const saveFamilyTree = async () => {
    try {
      if (!user?._id) {
        console.warn('Cannot save family tree: user ID not available');
        return;
      }

      setAutoSaving(true);
      
      // Validate data before saving
      const validNodes = workflowNodes.filter(isValidNode);
      const validConnections = connections.filter(isValidConnection);

      const treeData = {
        nodes: validNodes,
        connections: validConnections,
        zoomLevel: clampZoomLevel(zoomLevel),
        lastModified: Date.now(),
        userId: user._id,
        version: '1.0', // Add version for future compatibility
      };
      
      const serializedData = JSON.stringify(treeData);
      
      // Check data size (AsyncStorage has ~6MB limit on iOS)
      if (serializedData.length > LAYOUT_CONSTANTS.MAX_DATA_SIZE_MB * 1000000) { // Configured MB limit
        console.warn('Family tree data is too large, skipping some optional data');
        // Could implement data compression or selective saving here
      }
      
      await AsyncStorage.setItem(
        `familyTree_${user._id}`, 
        serializedData
      );
      console.log('Family tree saved successfully with', validNodes.length, 'nodes and', validConnections.length, 'connections');
    } catch (error) {
      console.error('Error saving family tree:', error);
      // Try to save minimal data as fallback
      try {
        const minimalData = {
          nodes: workflowNodes.slice(0, LAYOUT_CONSTANTS.BACKUP_NODE_LIMIT), // Save only first N nodes
          connections: [],
          zoomLevel: 1.0,
          lastModified: Date.now(),
          userId: user?._id,
          version: '1.0-minimal'
        };
        await AsyncStorage.setItem(
          `familyTree_${user?._id}_backup`, 
          JSON.stringify(minimalData)
        );
        console.log('Saved minimal backup data');
      } catch (backupError) {
        console.error('Failed to save backup data:', backupError);
      }
    } finally {
      setAutoSaving(false);
    }
  };

  const loadSavedFamilyTree = async () => {
    try {
      if (!user?._id) {
        console.warn('Cannot load family tree: user ID not available');
        return;
      }

      const savedData = await AsyncStorage.getItem(`familyTree_${user._id}`);
      if (savedData) {
        const treeData = JSON.parse(savedData);
        
        // Validate loaded data structure
        if (treeData && typeof treeData === 'object') {
          // Validate nodes array
          if (Array.isArray(treeData.nodes)) {
            const validNodes = treeData.nodes.filter(isValidNode);
            setWorkflowNodes(validNodes);
          }
          
          // Validate connections array
          if (Array.isArray(treeData.connections)) {
            const validConnections = treeData.connections.filter(isValidConnection);
            setConnections(validConnections);
          }
          
          // Validate zoom level
          if (typeof treeData.zoomLevel === 'number') {
            setZoomLevel(clampZoomLevel(treeData.zoomLevel));
          }
          
          console.log('Loaded saved family tree with', treeData.nodes?.length || 0, 'nodes');
        } else {
          console.warn('Invalid tree data structure, skipping load');
        }
      }
    } catch (error) {
      console.error('Error loading saved family tree:', error);
      // Clear corrupted data
      try {
        await AsyncStorage.removeItem(`familyTree_${user?._id}`);
        console.log('Cleared corrupted family tree data');
      } catch (clearError) {
        console.error('Error clearing corrupted data:', clearError);
      }
    }
  };

  // Auto-save when nodes or connections change
  useEffect(() => {
    if (workflowNodes.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        saveFamilyTree();
      }, LAYOUT_CONSTANTS.AUTO_SAVE_DELAY_MS); // Auto-save after changes
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [workflowNodes, connections, zoomLevel]);

  // Load saved data on component mount
  useEffect(() => {
    loadSavedFamilyTree();
  }, [user]);

  // Photo Management Functions
  const openPhotoManager = (person: Person) => {
    setSelectedPersonForPhotos(person);
    setShowPhotoManager(true);
  };

  const addPhotoToPerson = (personId: string, photoUri: string) => {
    setWorkflowNodes(prev => 
      prev.map(node => {
        if (node.person.id === personId) {
          const updatedPhotos = node.person.photos ? [...node.person.photos, photoUri] : [photoUri];
          // Set as main photo if it's the first one
          const mainPhoto = node.person.photo || photoUri;
          
          return {
            ...node,
            person: {
              ...node.person,
              photo: mainPhoto,
              photos: updatedPhotos,
            }
          };
        }
        return node;
      })
    );
  };

  const removePhotoFromPerson = (personId: string, photoUri: string) => {
    setWorkflowNodes(prev => 
      prev.map(node => {
        if (node.person.id === personId) {
          const updatedPhotos = node.person.photos?.filter(photo => photo !== photoUri) || [];
          // If removing main photo, set new main photo
          const mainPhoto = node.person.photo === photoUri 
            ? (updatedPhotos.length > 0 ? updatedPhotos[0] : undefined)
            : node.person.photo;
          
          return {
            ...node,
            person: {
              ...node.person,
              photo: mainPhoto,
              photos: updatedPhotos,
            }
          };
        }
        return node;
      })
    );
  };

  const setMainPhoto = (personId: string, photoUri: string) => {
    setWorkflowNodes(prev => 
      prev.map(node => {
        if (node.person.id === personId) {
          return {
            ...node,
            person: {
              ...node.person,
              photo: photoUri,
            }
          };
        }
        return node;
      })
    );
  };

  // Document Management Functions
  const openDocumentManager = (person: Person) => {
    setSelectedPersonForDocs(person);
    setShowDocumentManager(true);
  };

  const addDocumentToPerson = (personId: string, document: { id: string; name: string; type: 'birth_certificate' | 'marriage_certificate' | 'death_certificate' | 'photo' | 'document' | 'other'; uri: string; uploadDate: string; description?: string }) => {
    setWorkflowNodes(prev => 
      prev.map(node => {
        if (node.person.id === personId) {
          const updatedDocuments = node.person.documents ? [...node.person.documents, document] : [document];
          return {
            ...node,
            person: {
              ...node.person,
              documents: updatedDocuments,
            }
          };
        }
        return node;
      })
    );
  };

  const removeDocumentFromPerson = (personId: string, documentId: string) => {
    setWorkflowNodes(prev => 
      prev.map(node => {
        if (node.person.id === personId) {
          const updatedDocuments = node.person.documents?.filter(doc => doc.id !== documentId) || [];
          return {
            ...node,
            person: {
              ...node.person,
              documents: updatedDocuments,
            }
          };
        }
        return node;
      })
    );
  };

  // Timeline Functions
  const generateFamilyTimeline = () => {
    const events: Array<{
      date: string;
      type: 'birth' | 'death' | 'marriage' | 'divorce' | 'achievement';
      personId: string;
      personName: string;
      description: string;
      icon: string;
      color: string;
    }> = [];

    workflowNodes.forEach(node => {
      const person = node.person;
      
      // Birth events
      if (person.dateOfBirth || person.birthDate) {
        events.push({
          date: person.dateOfBirth || person.birthDate || '',
          type: 'birth',
          personId: person.id,
          personName: person.name,
          description: `${person.name} was born`,
          icon: 'happy-outline',
          color: '#4CAF50',
        });
      }

      // Death events
      if (person.dateOfDeath || person.deathDate) {
        events.push({
          date: person.dateOfDeath || person.deathDate || '',
          type: 'death',
          personId: person.id,
          personName: person.name,
          description: `${person.name} passed away`,
          icon: 'flower-outline',
          color: '#666666',
        });
      }

      // Marriage events
      if (person.spouses && person.spouses.length > 0) {
        person.spouses.forEach(spouseInfo => {
          if (spouseInfo.marriageDate) {
            const spouse = workflowNodes.find(n => n.person.id === spouseInfo.id)?.person;
            events.push({
              date: spouseInfo.marriageDate,
              type: 'marriage',
              personId: person.id,
              personName: person.name,
              description: `${person.name} married ${spouse?.name || 'Unknown'}`,
              icon: 'heart',
              color: '#E91E63',
            });
          }

          // Divorce events
          if (spouseInfo.divorceDate) {
            const spouse = workflowNodes.find(n => n.person.id === spouseInfo.id)?.person;
            events.push({
              date: spouseInfo.divorceDate,
              type: 'divorce',
              personId: person.id,
              personName: person.name,
              description: `${person.name} divorced ${spouse?.name || 'Unknown'}`,
              icon: 'heart-dislike',
              color: '#FF5722',
            });
          }
        });
      }

      // Achievement events
      if (person.achievements && person.achievements.length > 0) {
        person.achievements.forEach((achievement, index) => {
          // Since achievements don't have dates, we'll use a mock date for demonstration
          const mockDate = new Date();
          mockDate.setFullYear(mockDate.getFullYear() - Math.floor(Math.random() * 20));
          
          events.push({
            date: mockDate.toISOString(),
            type: 'achievement',
            personId: person.id,
            personName: person.name,
            description: `${person.name}: ${achievement}`,
            icon: 'trophy',
            color: '#FF9800',
          });
        });
      }
    });

    // Sort events by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const openTimeline = () => {
    setShowTimeline(true);
  };

  // Import/Export Functions
  const exportFamilyTree = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const familyData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          totalMembers: workflowNodes.length,
          format: format,
        },
        people: workflowNodes.map(node => ({
          ...node.person,
          position: { x: node.x, y: node.y },
          generation: node.generation,
        })),
        connections: connections,
        settings: {
          zoomLevel,
          panOffset,
        }
      };

      if (format === 'json') {
        // JSON Export
        const jsonData = JSON.stringify(familyData, null, 2);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web download - only if we're in a browser environment
          try {
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `family-tree-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            // Fallback to share if web APIs don't work
            await Share.share({
              message: `Family Tree Data:\n\n${jsonData}`,
              title: 'Family Tree Export',
            });
          }
        } else {
          // Mobile share
          await Share.share({
            message: `Family Tree Data:\n\n${jsonData}`,
            title: 'Family Tree Export',
          });
        }
      } else if (format === 'csv') {
        // CSV Export
        const csvHeaders = 'Name,First Name,Last Name,Birth Date,Death Date,Gender,Parents,Children,Spouse,Generation\n';
        const csvRows = familyData.people.map(person => {
          return [
            `"${person.name || ''}"`,
            `"${person.firstName || ''}"`,
            `"${person.lastName || ''}"`,
            `"${person.dateOfBirth || person.birthDate || ''}"`,
            `"${person.dateOfDeath || person.deathDate || ''}"`,
            `"${person.gender || ''}"`,
            `"${person.parents?.join(';') || ''}"`,
            `"${person.children?.join(';') || ''}"`,
            `"${person.spouse || ''}"`,
            `"${person.generation || ''}"`
          ].join(',');
        }).join('\n');
        const csvData = csvHeaders + csvRows;
        
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `family-tree-${Date.now()}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            // Fallback to share if web APIs don't work
            await Share.share({
              message: csvData,
              title: 'Family Tree CSV Export',
            });
          }
        } else {
          await Share.share({
            message: csvData,
            title: 'Family Tree CSV Export',
          });
        }
      }

      Alert.alert('Export Successful', `Family tree exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'There was an error exporting the family tree');
    }
  };

  const importFamilyTree = async (data: string, format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        const importedData = JSON.parse(data);
        
        if (importedData.people && Array.isArray(importedData.people)) {
          // Convert imported data to workflow nodes
          const importedNodes: WorkflowNode[] = importedData.people.map((person: any, index: number) => ({
            id: person.id || `imported-${Date.now()}-${index}`,
            person: {
              id: person.id || `imported-${Date.now()}-${index}`,
              name: person.name || 'Unknown',
              firstName: person.firstName || '',
              lastName: person.lastName || '',
              gender: person.gender || 'male',
              generation: person.generation || 0,
              position: person.position || { x: 0, y: 0 },
              dateOfBirth: person.dateOfBirth || person.birthDate,
              dateOfDeath: person.dateOfDeath || person.deathDate,
              parents: person.parents,
              children: person.children,
              siblings: person.siblings,
              spouse: person.spouse,
              spouses: person.spouses,
              photo: person.photo,
              photos: person.photos,
              bio: person.bio,
              achievements: person.achievements,
              documents: person.documents,
            },
            x: person.position?.x || Math.random() * 400 + 100,
            y: person.position?.y || Math.random() * 300 + 100,
            generation: person.generation || 0,
          }));

          setWorkflowNodes(importedNodes);
          
          if (importedData.connections) {
            setConnections(importedData.connections);
          }
          
          if (importedData.settings) {
            setZoomLevel(importedData.settings.zoomLevel || 0.7);
            setPanOffset(importedData.settings.panOffset || { x: 0, y: 0 });
          }

          Alert.alert('Import Successful', `Imported ${importedNodes.length} family members`);
          await saveFamilyTree(); // Auto-save imported data
        } else {
          throw new Error('Invalid JSON format - missing people array');
        }
      } else if (format === 'csv') {
        // CSV Import
        const lines = data.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const peopleData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const person: any = {};
          headers.forEach((header, index) => {
            person[header.toLowerCase().replace(' ', '')] = values[index] || '';
          });
          return person;
        });

        const importedNodes: WorkflowNode[] = peopleData.map((person: any, index: number) => ({
          id: `csv-import-${Date.now()}-${index}`,
          person: {
            id: `csv-import-${Date.now()}-${index}`,
            name: person.name || `${person.firstname} ${person.lastname}`.trim() || 'Unknown',
            firstName: person.firstname || '',
            lastName: person.lastname || '',
            gender: (person.gender?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female',
            generation: parseInt(person.generation) || 0,
            position: { x: 0, y: 0 },
            dateOfBirth: person.birthdate,
            dateOfDeath: person.deathdate,
            parents: person.parents ? person.parents.split(';') : [],
            children: person.children ? person.children.split(';') : [],
            spouse: person.spouse || '',
          },
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
          generation: parseInt(person.generation) || 0,
        }));

        setWorkflowNodes(importedNodes);
        Alert.alert('Import Successful', `Imported ${importedNodes.length} family members from CSV`);
        await saveFamilyTree(); // Auto-save imported data
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', 'There was an error importing the family tree data. Please check the file format.');
    }
  };

  // Auto-center the view on the family tree when component mounts
  useEffect(() => {
    if (workflowNodes.length > 0 && scrollViewRef.current) {
      // Find the bounds of all nodes to center the view properly
      const nodeXs = workflowNodes.map(node => node.x);
      const nodeYs = workflowNodes.map(node => node.y);
      const minX = Math.min(...nodeXs) - 100; // Add padding
      const maxX = Math.max(...nodeXs) + 100;
      const minY = Math.min(...nodeYs) - 100;
      const maxY = Math.max(...nodeYs) + 100;
      
      // Calculate the center of the actual family tree content
      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;
      const treeCenterX = (minX + maxX) / 2;
      const treeCenterY = (minY + maxY) / 2;
      
      // Center the tree in the viewport
      const centerX = treeCenterX - width / 2;
      const centerY = treeCenterY - height / 2;
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, centerX),
          y: Math.max(0, centerY),
          animated: true,
        });
      }, 300);
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
      relationshipType: 'child',
      bio: '',
      profilePhoto: undefined,
      galleryImages: [],
    });
    setShowAddChildModal(true);
  };

  // Handle form submission from AddChildModal
  const handleAddMemberSubmit = async (data: typeof modalFormData) => {
    console.log('🔄 Adding new family member...');
    const success = await addFamilyMemberFromModal(data, selectedPerson);
    if (success) {
      console.log('✅ New family member added successfully');
      setShowAddChildModal(false);
      setModalFormData({
        firstName: '',
        lastName: '',
        yearOfBirth: '',
        placeOfBirth: '',
        gender: 'male',
        relationshipType: 'child',
        bio: '',
        profilePhoto: undefined,
        galleryImages: [],
      });
      
      // Note: No need to call refreshFamilyTree() here because addFamilyMemberFromModal
      // already updates the familyTree state, which will trigger the useEffect to regenerate connections
    }
  };

  // Handle share functionality
  const handleShare = () => {
    Alert.alert(
      'Export & Share',
      'Choose how to export or share your family tree:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export JSON', onPress: () => exportFamilyTree('json') },
        { text: 'Export CSV', onPress: () => exportFamilyTree('csv') },
        { text: 'Share Summary', onPress: handleShareSummary },
        { text: 'Share Link', onPress: handleShareLink },
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
      'Import & Settings',
      'Import family tree data or adjust settings:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import JSON',
          onPress: () => {
            Alert.prompt(
              'Import JSON Data',
              'Paste your JSON family tree data:',
              (text) => {
                if (text) {
                  importFamilyTree(text, 'json');
                }
              }
            );
          }
        },
        { 
          text: 'Import CSV',
          onPress: () => {
            Alert.prompt(
              'Import CSV Data',
              'Paste your CSV family tree data:',
              (text) => {
                if (text) {
                  importFamilyTree(text, 'csv');
                }
              }
            );
          }
        },
        { 
          text: 'Settings',
          onPress: () => {
            Alert.alert(
              'Settings',
              'Settings features:\n\n• Auto-save: Enabled ✓\n• Search: Enabled ✓\n• Zoom controls: Enabled ✓\n• Timeline view: Enabled ✓\n• Document management: Enabled ✓',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  // Check for collisions with other nodes
  const checkCollision = (nodeId: string, newX: number, newY: number): { x: number; y: number } => {
    const nodeSize = 100; // Node width/height
    const minDistance = 120; // Minimum distance between node centers
    
    let adjustedX = newX;
    let adjustedY = newY;
    
    // Check against all other nodes
    workflowNodes.forEach(node => {
      if (node.id !== nodeId) {
        const distance = Math.sqrt(
          Math.pow(adjustedX - node.x, 2) + Math.pow(adjustedY - node.y, 2)
        );
        
        if (distance < minDistance) {
          // Calculate push-away vector
          const angle = Math.atan2(adjustedY - node.y, adjustedX - node.x);
          adjustedX = node.x + Math.cos(angle) * minDistance;
          adjustedY = node.y + Math.sin(angle) * minDistance;
        }
      }
    });
    
    // Keep within canvas bounds
    const canvasWidth = width * 3; // Reduced from 4x to 2x
    const canvasHeight = height * 3; // Reduced from 4x to 2x
    adjustedX = Math.max(nodeSize/2, Math.min(canvasWidth - nodeSize/2, adjustedX));
    adjustedY = Math.max(nodeSize/2, Math.min(canvasHeight - nodeSize/2, adjustedY));
    
    return { x: adjustedX, y: adjustedY };
  };

  // Update node position with collision detection
  const updateNodePosition = (nodeId: string, newX: number, newY: number) => {
    const adjustedPosition = checkCollision(nodeId, newX, newY);
    
    setWorkflowNodes(prev => 
      prev.map(node => 
        node.id === nodeId 
          ? { ...node, x: adjustedPosition.x, y: adjustedPosition.y }
          : node
      )
    );
    
    // Update connections
    setConnections(prev => 
      prev.map(connection => ({
        ...connection,
        fromX: connection.from === nodeId ? adjustedPosition.x : connection.fromX,
        fromY: connection.from === nodeId ? adjustedPosition.y + 50 : connection.fromY,
        toX: connection.to === nodeId ? adjustedPosition.x : connection.toX,
        toY: connection.to === nodeId ? adjustedPosition.y - 50 : connection.toY,
      }))
    );
  };

  // Render draggable round image nodes
  const renderWorkflowNode = (node: WorkflowNode) => {
    const isCurrentUser = node.person.id === user?._id;
    const isAlive = node.person.isAlive !== false;
    const birthYear = node.person.dateOfBirth ? new Date(node.person.dateOfBirth).getFullYear() : null;
    const deathYear = node.person.dateOfDeath ? new Date(node.person.dateOfDeath).getFullYear() : null;
    const yearText = birthYear ? (deathYear ? `${birthYear} - ${deathYear}` : `${birthYear} - Present`) : 'Unknown';
    
    // Check if this node matches search query
    const isSearchMatch = searchQuery.length > 0 && 
      node.person.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isSearchFiltered = searchQuery.length > 0 && !isSearchMatch;
    
    // Simple drag handling without hooks violation
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggedNode(node.id);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update position during drag
        const newX = node.x + gestureState.dx;
        const newY = node.y + gestureState.dy;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const newX = node.x + gestureState.dx;
        const newY = node.y + gestureState.dy;
        updateNodePosition(node.id, newX, newY);
        setDraggedNode(null);
      },
    });

    return (
      <View
          {...panResponder.panHandlers}
          style={[
            styles.roundNode,
            { 
              position: 'absolute',
              left: node.x - 50,
              top: node.y - 50,
              opacity: isSearchFiltered ? 0.3 : 1, // Dim non-matching nodes
            },
            isSearchMatch && styles.searchHighlight, // Highlight matching nodes
          ]}
        >
          <TouchableOpacity
            style={styles.nodeContent}
            onPress={() => handlePersonPress(node.person)}
            onLongPress={() => openPhotoManager(node.person)}
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
          
          {/* Connection points - n8n style */}
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
          
          {/* Creator indicator - show if user created this family member */}
          {(node.person.userId === user?._id || node.person.createdBy === user?._id) && !isCurrentUser && (
            <View style={styles.creatorIndicator}>
              <Ionicons name="person-add" size={10} color="#00D4FF" />
            </View>
          )}
          
          {/* Only show + and - buttons on leaf nodes (nodes without children or last in generation) */}
          {(!node.person.children || node.person.children.length === 0) && (
            <>
              {/* Add family member button */}
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setSelectedPerson(node.person);
                  setShowAddChildModal(true);
                }}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Remove family member button - only show if user has permission */}
              {canUserDelete(node.person) && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    const isCreator = node.person.userId === user?._id || node.person.createdBy === user?._id;
                    const deleteMessage = isCreator 
                      ? `Are you sure you want to remove ${node.person.name} from the family tree? This action cannot be undone.`
                      : `Are you sure you want to remove ${node.person.name} from the family tree? This action cannot be undone.`;
                      
                    Alert.alert(
                      'Remove Family Member',
                      deleteMessage,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Remove', 
                          style: 'destructive',
                          onPress: () => deleteFamilyMember(node.person.id)
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
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
          
          </TouchableOpacity>
        </View>
    );
  };

  // Render simple, reliable connections
  const renderConnections = () => {
    if (connections.length === 0) {
      console.log('WorkflowGenealogyScreen: No connections to render');
      return null;
    }

    console.log('WorkflowGenealogyScreen: Rendering', connections.length, 'connections');

    const paths = [];
    const circles = [];
    
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      const startX = connection.fromX;
      const startY = connection.fromY;
      const endX = connection.toX;
      const endY = connection.toY;
      
      // Simple straight line for now to test
      paths.push(
        <Path
          key={`path-${i}`}
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#00D4FF"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      );
      
      circles.push(
        <Circle key={`start-${i}`} cx={startX} cy={startY} r="4" fill="#00D4FF" />,
        <Circle key={`end-${i}`} cx={endX} cy={endY} r="4" fill="#00D4FF" />
      );
    }

    return (
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={width * 1.5}
        height={height * 1.5}
        pointerEvents="none"
      >
        {paths}
        {circles}
      </Svg>
    );
  };

  // Generate subtle family tree background pattern (Android-safe)
  const renderSubtleBackground = () => {
    // Significantly reduced complexity for Android stability
    const dots = [];
    const dotSpacing = 120; // Much larger spacing
    const canvasWidth = width * 1.5; // Reduced canvas size
    const canvasHeight = height * 1.5; // Reduced canvas size

    // Limit total dots to prevent Android memory issues
    const maxDots = 50;
    let dotCount = 0;

    for (let x = 0; x < canvasWidth && dotCount < maxDots; x += dotSpacing) {
      for (let y = 0; y < canvasHeight && dotCount < maxDots; y += dotSpacing) {
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r="1"
            fill="#ffffff"
            opacity={0.05} // Even more subtle
          />
        );
        dotCount++;
      }
    }

    return (
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={canvasWidth}
        height={canvasHeight}
        pointerEvents="none"
      >
        <Defs>
          {/* Subtle tree-like pattern */}
          <Pattern
            id="treePattern"
            patternUnits="userSpaceOnUse"
            width={120}
            height={120}
          >
            {/* Very faint connecting lines in a tree-like pattern */}
            <Line
              x1={60}
              y1={20}
              x2={60}
              y2={100}
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity={0.05}
            />
            <Line
              x1={20}
              y1={60}
              x2={100}
              y2={60}
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity={0.05}
            />
          </Pattern>
        </Defs>
        <Rect
          width={canvasWidth}
          height={canvasHeight}
          fill="url(#treePattern)"
        />
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
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search-outline" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowMenuDropdown(!showMenuDropdown)}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
          </TouchableOpacity>
        </View>
        
        {/* Menu Dropdown */}
        {showMenuDropdown && (
          <>
            <TouchableOpacity 
              style={styles.menuOverlay} 
              onPress={() => setShowMenuDropdown(false)}
              activeOpacity={1}
            />
            <View style={styles.menuDropdown}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { openTimeline(); setShowMenuDropdown(false); }}>
                <Ionicons name="time-outline" size={16} color="#888" />
                <Text style={styles.menuItemText}>Timeline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { handleShare(); setShowMenuDropdown(false); }}>
                <Ionicons name="share-outline" size={16} color="#888" />
                <Text style={styles.menuItemText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { handleSettings(); setShowMenuDropdown(false); }}>
                <Ionicons name="settings-outline" size={16} color="#888" />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search family members..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          <TouchableOpacity 
            style={styles.searchClearButton}
            onPress={() => {
              setSearchQuery('');
              setShowSearch(false);
            }}
          >
            <Ionicons name="close" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      )}

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
            contentContainerStyle={[
              styles.canvasContent,
              {
                transform: [{ scale: zoomLevel }],
                width: width * 3 * zoomLevel,
                height: height * 3 * zoomLevel,
              }
            ]}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={true}
            maximumZoomScale={2}
            minimumZoomScale={0.5}
            zoomEnabled={true} // Enable native zoom for mobile-friendly interaction
            directionalLockEnabled={false}
            scrollEnabled={true}
          >
            {/* Subtle background pattern */}
            {renderSubtleBackground()}
            
            {/* Simple, reliable SVG connections */}
            <Svg 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: -1,  // Put SVG BEHIND nodes so they're clickable
                transform: `scale(${zoomLevel})`,
              }}
              width={width * 3}
              height={height * 3}
              pointerEvents="none"
            >
              
              
              {/* N8N-STYLE CONNECTIONS - GENERATION-BASED FLOW */}
              {(() => {
                const connections = [];
                const generations = {};
                
                // Group nodes by generation
                workflowNodes.forEach(node => {
                  if (!generations[node.generation]) {
                    generations[node.generation] = [];
                  }
                  generations[node.generation].push(node);
                });
                
                const genKeys = Object.keys(generations).map(Number).sort();
                
                // Connect based on ACTUAL parent-child relationships
                workflowNodes.forEach(parentNode => {
                  if (parentNode.person.children && parentNode.person.children.length > 0) {
                    parentNode.person.children.forEach(childId => {
                      const childNode = workflowNodes.find(n => n.id === childId);
                      if (childNode) {
                        const startX = parentNode.x;
                        const startY = parentNode.y + 50;
                        const endX = childNode.x;
                        const endY = childNode.y - 50;
                        
                        // N8N-style smooth curve
                        const controlPointY = startY + (endY - startY) * 0.6;
                        const pathData = `M ${startX} ${startY} C ${startX} ${controlPointY} ${endX} ${controlPointY} ${endX} ${endY}`;
                        
                        connections.push(
                          <Path
                            key={`parent-child-${parentNode.id}-${childId}`}
                            d={pathData}
                            stroke="#FFFFFF"
                            strokeWidth="1"
                            fill="none"
                            strokeLinecap="round"
                            opacity={0.7}
                          />
                        );
                      }
                    });
                  }
                });
                
                // Horizontal connections within same generation (siblings)
                Object.values(generations).forEach(genNodes => {
                  if (genNodes.length > 1) {
                    for (let i = 0; i < genNodes.length - 1; i++) {
                      const node1 = genNodes[i];
                      const node2 = genNodes[i + 1];
                      
                      const startX = node1.x + 50;
                      const startY = node1.y;
                      const endX = node2.x - 50;
                      const endY = node2.y;
                      
                      // Horizontal curve for siblings
                      const controlPointX = startX + (endX - startX) * 0.5;
                      const pathData = `M ${startX} ${startY} C ${controlPointX} ${startY} ${controlPointX} ${endY} ${endX} ${endY}`;
                      
                      connections.push(
                        <Path
                          key={`sibling-${node1.id}-${node2.id}`}
                          d={pathData}
                          stroke="#FFFFFF"
                          strokeWidth="1"
                          fill="none"
                          strokeLinecap="round"
                          opacity={0.7}
                        />
                      );
                    }
                  }
                });
                
                return connections;
              })()}
              
            </Svg>
            
            {/* Workflow nodes */}
            <View style={styles.nodesContainer}>
              {workflowNodes.length > 50 ? (
                <View style={styles.tooManyNodesWarning}>
                  <Text style={styles.warningText}>
                    Too many family members to display ({workflowNodes.length})
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Please use search or filters to reduce complexity
                  </Text>
                </View>
              ) : (
                workflowNodes.map(node => (
                  <React.Fragment key={node.id}>
                    {renderWorkflowNode(node)}
                  </React.Fragment>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {/* Workflow controls - bottom right */}
        <View style={styles.workflowControls}>
          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (scrollViewRef.current) {
                  // Zoom in by reducing content size (making things appear larger)
                  setZoomLevel(prev => Math.min(prev + 0.2, 2.0));
                }
              }}
            >
              <Ionicons name="add" size={16} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (scrollViewRef.current) {
                  // Zoom out by increasing content size (making things appear smaller)
                  setZoomLevel(prev => Math.max(prev - 0.2, 0.3));
                }
              }}
            >
              <Ionicons name="remove" size={16} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                // Fit to screen - center the family tree
                if (workflowNodes.length > 0 && scrollViewRef.current) {
                  const nodeXs = workflowNodes.map(node => node.x);
                  const nodeYs = workflowNodes.map(node => node.y);
                  const minX = Math.min(...nodeXs) - 100;
                  const maxX = Math.max(...nodeXs) + 100;
                  const minY = Math.min(...nodeYs) - 100;
                  const maxY = Math.max(...nodeYs) + 100;
                  
                  const centerX = (minX + maxX) / 2 - width / 2;
                  const centerY = (minY + maxY) / 2 - height / 2;
                  
                  scrollViewRef.current.scrollTo({
                    x: Math.max(0, centerX),
                    y: Math.max(0, centerY),
                    animated: true,
                  });
                  
                  setZoomLevel(0.8); // Reset to good viewing zoom
                }
              }}
            >
              <Ionicons name="scan-outline" size={16} color="#888" />
            </TouchableOpacity>
          </View>
          

          {/* Minimap */}
          <View style={styles.minimap}>
            <Text style={styles.minimapTitle}>Overview</Text>
            <TouchableOpacity 
              style={styles.minimapCanvas}
              onPress={() => {
                // Navigate to center of family tree
                if (workflowNodes.length > 0 && scrollViewRef.current) {
                  const nodeXs = workflowNodes.map(node => node.x);
                  const nodeYs = workflowNodes.map(node => node.y);
                  const minX = Math.min(...nodeXs) - 100;
                  const maxX = Math.max(...nodeXs) + 100;
                  const minY = Math.min(...nodeYs) - 100;
                  const maxY = Math.max(...nodeYs) + 100;
                  
                  const centerX = (minX + maxX) / 2 - width / 2;
                  const centerY = (minY + maxY) / 2 - height / 2;
                  
                  scrollViewRef.current.scrollTo({
                    x: Math.max(0, centerX * zoomLevel),
                    y: Math.max(0, centerY * zoomLevel),
                    animated: true,
                  });
                }
              }}
            >
              {/* Simplified minimap representation */}
              {workflowNodes.slice(0, 12).map((node, index) => (
                <TouchableOpacity
                  key={node.id}
                  style={[
                    styles.minimapNode,
                    {
                      left: (node.x / (width * 3)) * 60,
                      top: (node.y / (height * 3)) * 40,
                      backgroundColor: node.person.isCurrentUser ? '#04a7c7' : '#888',
                    }
                  ]}
                  onPress={() => {
                    // Navigate to specific node
                    if (scrollViewRef.current) {
                      const targetX = node.x - width / 2;
                      const targetY = node.y - height / 2;
                      
                      scrollViewRef.current.scrollTo({
                        x: Math.max(0, targetX * zoomLevel),
                        y: Math.max(0, targetY * zoomLevel),
                        animated: true,
                      });
                    }
                  }}
                />
              ))}
              {/* Current view indicator */}
              <View style={styles.minimapViewport} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile-Friendly Floating Action Button for Adding Family Members */}
        {workflowNodes.length > 0 && (
          <TouchableOpacity
            style={styles.addFamilyFab}
            onPress={() => {
              Alert.alert(
                'Add Family Member',
                'Choose the type of family member to add:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Add Child', 
                    onPress: () => {
                      if (workflowNodes.length > 0) {
                        // Set first person as default parent for demo
                        setSelectedPerson(workflowNodes[0].person);
                        handleOpenAddMemberModal();
                      }
                    }
                  },
                  { 
                    text: 'Add Sibling', 
                    onPress: () => {
                      if (workflowNodes.length > 0) {
                        handleOpenAddMemberModal();
                      }
                    }
                  },
                  { 
                    text: 'Add Parent', 
                    onPress: () => {
                      if (workflowNodes.length > 0) {
                        handleOpenAddMemberModal();
                      }
                    }
                  },
                ]
              );
            }}
          >
            <Ionicons name="person-add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <ComprehensivePersonModal
        visible={showPersonModal}
        person={selectedPerson}
        onClose={() => setShowPersonModal(false)}
        onEdit={handleEditPress}
        onAddChild={handleAddChildPress}
        onOpenDocuments={openDocumentManager}
      />

      <EditPersonModal
        visible={showEditModal}
        person={editingPerson}
        onClose={() => setShowEditModal(false)}
        onSave={saveEditedPerson}
        onDelete={() => editingPerson && deleteFamilyMember(editingPerson.id)}
      />

      <AddChildModal
        visible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAdd={handleAddMemberSubmit}
        personData={modalFormData}
        onDataChange={setModalFormData}
      />

      {/* Photo Manager Modal */}
      <Modal
        visible={showPhotoManager}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoManager(false)}
      >
        <View style={styles.photoManagerOverlay}>
          <View style={styles.photoManagerContent}>
            <View style={styles.photoManagerHeader}>
              <Text style={styles.photoManagerTitle}>
                {selectedPersonForPhotos?.name} - Photo Gallery
              </Text>
              <TouchableOpacity onPress={() => setShowPhotoManager(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.photoManagerBody}>
              {/* Current Main Photo */}
              {selectedPersonForPhotos?.photo && (
                <View style={styles.mainPhotoSection}>
                  <Text style={styles.sectionTitle}>Main Photo</Text>
                  <Image 
                    source={{ uri: selectedPersonForPhotos.photo }} 
                    style={styles.mainPhotoImage}
                  />
                </View>
              )}
              
              {/* All Photos Grid */}
              <View style={styles.allPhotosSection}>
                <Text style={styles.sectionTitle}>
                  All Photos ({selectedPersonForPhotos?.photos?.length || 0})
                </Text>
                
                <View style={styles.photoGrid}>
                  {/* Add Photo Button */}
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={async () => {
                      try {
                        // Simple image picker implementation
                        Alert.alert(
                          'Add Photo',
                          'Choose photo source:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Camera', 
                              onPress: () => {
                                // For now, use a placeholder image
                                const photoUri = `https://picsum.photos/300/300?random=${Date.now()}`;
                                addPhotoToPerson(selectedPersonForPhotos?.id || '', photoUri);
                                Alert.alert('Success', 'Photo added! In production, this would use the device camera.');
                              }
                            },
                            { 
                              text: 'Gallery', 
                              onPress: () => {
                                // For now, use a placeholder image
                                const photoUri = `https://picsum.photos/300/300?random=${Date.now()}`;
                                addPhotoToPerson(selectedPersonForPhotos?.id || '', photoUri);
                                Alert.alert('Success', 'Photo added! In production, this would use the device gallery.');
                              }
                            },
                          ]
                        );
                      } catch (error) {
                        Alert.alert('Error', 'Failed to add photo. Please try again.');
                      }
                    }}
                  >
                    <Ionicons name="camera" size={40} color="#888" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                  
                  {/* Existing Photos */}
                  {selectedPersonForPhotos?.photos?.map((photoUri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                      <View style={styles.photoActions}>
                        <TouchableOpacity
                          style={styles.photoActionButton}
                          onPress={() => setMainPhoto(selectedPersonForPhotos?.id || '', photoUri)}
                        >
                          <Ionicons 
                            name={photoUri === selectedPersonForPhotos?.photo ? "star" : "star-outline"} 
                            size={16} 
                            color={photoUri === selectedPersonForPhotos?.photo ? "#FFD700" : "#888"} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.photoActionButton}
                          onPress={() => removePhotoFromPerson(selectedPersonForPhotos?.id || '', photoUri)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Document Manager Modal */}
      <Modal
        visible={showDocumentManager}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDocumentManager(false)}
      >
        <View style={styles.documentModalOverlay}>
          <View style={styles.documentModalContainer}>
            <View style={styles.documentModalHeader}>
              <Text style={styles.documentModalTitle}>
                {selectedPersonForDocs?.name} - Documents
              </Text>
              <TouchableOpacity
                style={styles.documentModalClose}
                onPress={() => setShowDocumentManager(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.documentGrid}>
                {/* Add Document Button */}
                <TouchableOpacity
                  style={styles.addDocumentButton}
                  onPress={() => {
                    // Mock adding a document (in real app, this would open document picker)
                    const mockDocument = {
                      id: Date.now().toString(),
                      name: `Document_${Date.now()}.pdf`,
                      type: 'document' as const,
                      uri: 'mock://document/path.pdf',
                      uploadDate: new Date().toISOString(),
                      description: 'Family document'
                    };
                    addDocumentToPerson(selectedPersonForDocs?.id || '', mockDocument);
                  }}
                >
                  <Ionicons name="document-attach" size={40} color={COLORS.primary} />
                  <Text style={styles.addDocumentText}>Add Document</Text>
                </TouchableOpacity>

                {/* Document List */}
                {selectedPersonForDocs?.documents?.map((document, index) => (
                  <View key={index} style={styles.documentItem}>
                    <View style={styles.documentIcon}>
                      <Ionicons 
                        name={document.type === 'birth_certificate' ? 'document' : 
                              document.type === 'marriage_certificate' ? 'heart' :
                              document.type === 'death_certificate' ? 'document-outline' :
                              document.type === 'photo' ? 'image' : 'folder'} 
                        size={24} 
                        color={COLORS.primary} 
                      />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{document.name}</Text>
                      <Text style={styles.documentType}>{document.type.replace('_', ' ')}</Text>
                      <Text style={styles.documentDate}>
                        Added: {new Date(document.uploadDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.documentDeleteButton}
                      onPress={() => removeDocumentFromPerson(selectedPersonForDocs?.id || '', document.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Timeline Modal */}
      <Modal
        visible={showTimeline}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeline(false)}
      >
        <View style={styles.timelineModalOverlay}>
          <View style={styles.timelineModalContainer}>
            <View style={styles.timelineModalHeader}>
              <Text style={styles.timelineModalTitle}>Family Timeline</Text>
              <TouchableOpacity
                style={styles.timelineModalClose}
                onPress={() => setShowTimeline(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.timelineContainer}>
                {generateFamilyTimeline().map((event, index) => (
                  <View key={`${event.personId}-${event.type}-${index}`} style={styles.timelineEvent}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineIcon, { backgroundColor: event.color }]}>
                        <Ionicons name={event.icon as any} size={16} color="#FFFFFF" />
                      </View>
                      {index < generateFamilyTimeline().length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    
                    <View style={styles.timelineRight}>
                      <View style={styles.timelineEventCard}>
                        <Text style={styles.timelineEventDate}>
                          {new Date(event.date).toLocaleDateString()}
                        </Text>
                        <Text style={styles.timelineEventTitle}>
                          {event.description}
                        </Text>
                        <View style={styles.timelineEventMeta}>
                          <View style={[styles.timelineEventType, { backgroundColor: `${event.color}20` }]}>
                            <Text style={[styles.timelineEventTypeText, { color: event.color }]}>
                              {event.type.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
                
                {generateFamilyTimeline().length === 0 && (
                  <View style={styles.emptyTimeline}>
                    <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTimelineText}>No events in timeline yet</Text>
                    <Text style={styles.emptyTimelineSubtext}>
                      Add birth dates, marriage dates, and achievements to see them here
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Add Family Member FAB */}
      <TouchableOpacity 
        style={styles.addFamilyFab}
        onPress={() => {
          Alert.alert(
            'Add Family Member',
            'Choose how to add a new family member:',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Add Root Member', 
                onPress: () => {
                  setSelectedPerson(null);
                  setShowAddChildModal(true);
                }
              },
              { 
                text: 'Add to Selected', 
                onPress: () => {
                  if (Object.keys(familyTree).length > 0) {
                    const firstPerson = Object.values(familyTree)[0];
                    setSelectedPerson(firstPerson);
                    setShowAddChildModal(true);
                  } else {
                    setSelectedPerson(null);
                    setShowAddChildModal(true);
                  }
                }
              },
            ]
          );
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  chatButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#04a7c7',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: getSystemFont(),
  },
  workflowCanvas: {
    flex: 1,
    position: 'relative',
  },
  canvasScrollView: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  canvasContent: {
    minWidth: width * 3,
    minHeight: height * 3,
    position: 'relative',
    padding: 20,
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
  nodeContent: {
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#ffffff',
    position: 'absolute',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  inputPoint: {
    top: -6,
    left: '50%',
    marginLeft: -6,
  },
  outputPoint: {
    bottom: -6,
    left: '50%',
    marginLeft: -6,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    position: 'relative',
  },
  minimapNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  minimapViewport: {
    position: 'absolute',
    width: 12,
    height: 8,
    borderWidth: 1,
    borderColor: '#04a7c7',
    backgroundColor: 'rgba(4, 167, 199, 0.2)',
    top: 20,
    left: 24,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: COLORS.background,
    borderRadius: 18,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 14,
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchHighlight: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  
  // Photo Management Modal Styles
  photoModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  photoModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoModalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  photoModalClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoActions: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  photoActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mainPhotoText: {
    fontSize: 10,
    fontFamily: getSystemFont('semiBold'),
    color: '#000000',
  },
  addPhotoButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 4,
  },

  // Document Management Modal Styles
  documentModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  documentModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  documentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentModalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  documentModalClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  documentGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  addDocumentText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: COLORS.primary,
    marginLeft: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 10,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
  },
  documentDeleteButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },

  // Timeline Modal Styles
  timelineModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timelineModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  timelineModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineModalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  timelineModalClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineEvent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.3,
    marginTop: 8,
  },
  timelineRight: {
    flex: 1,
  },
  timelineEventCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  timelineEventDate: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timelineEventTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 8,
  },
  timelineEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineEventType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timelineEventTypeText: {
    fontSize: 10,
    fontFamily: getSystemFont('medium'),
    textTransform: 'capitalize',
  },
  emptyTimeline: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTimelineText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTimelineSubtext: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFamilyFab: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  addButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  creatorIndicator: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  tooManyNodesWarning: {
    position: 'absolute',
    top: 200,
    left: 50,
    right: 50,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#ff6b6b',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningSubtext: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WorkflowGenealogyScreen;