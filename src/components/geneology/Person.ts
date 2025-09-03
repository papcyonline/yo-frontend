// src/screens/main/types/Person.ts

export interface Person {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  burialPlace?: string;
  isAlive: boolean;
  profileImage?: string;
  children: string[]; // Array of child IDs
  spouse?: string;
  parents?: string[];
  generation: number;
  isUser?: boolean; // If this person is a registered user
  bio?: string;
  profession?: string;
  achievements?: string[];
  photos?: string[];
  isEditable?: boolean; // Can current user edit this person
}