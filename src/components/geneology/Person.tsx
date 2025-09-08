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
  spouse?: string;
  isCurrentUser?: boolean;
  isAIMatched?: boolean;
  matchConfidence?: number;
  userId?: string;
  
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
}