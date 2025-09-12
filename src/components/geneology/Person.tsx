export interface Person {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  placeOfBirth?: string;
  photo?: string;
  bio?: string;
  gender: 'male' | 'female';
  generation: number;
  position: { x: number; y: number };
  parents?: string[];
  children?: string[];
  siblings?: string[];
  spouse?: string; // Keep for backward compatibility
  spouses?: Array<{
    id: string;
    marriageDate?: string;
    divorceDate?: string;
    isCurrentSpouse: boolean;
  }>;
  isCurrentUser?: boolean;
  isAIMatched?: boolean;
  matchConfidence?: number;
  userId?: string;
  createdBy?: string;
  
  // Additional fields for compatibility with existing code
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  profession?: string;
  isAlive?: boolean;
  photos?: string[];
  achievements?: string[];
  burialPlace?: string;
  isEditable?: boolean;
  documents?: Array<{
    id: string;
    name: string;
    type: 'birth_certificate' | 'marriage_certificate' | 'death_certificate' | 'photo' | 'document' | 'other';
    uri: string;
    uploadDate: string;
    description?: string;
  }>;
}