// Smart Progressive Question Flow System - Updated for Unique User Experience
export interface SmartQuestion {
  id: string;
  question: string;
  placeholder: string;
  type: 'text' | 'multiline' | 'select' | 'date' | 'story' | 'card-select' | 'image' | 'date-picker' | 'multi-image';
  field: string;
  required?: boolean;
  phase: 'essential' | 'core' | 'rich';
  category: 'basic' | 'family' | 'personal' | 'stories' | 'preferences' | 'bio' | 'media';
  options?: string[];
  cards?: Array<{id: string, label: string, icon: string}>;
  dependencies?: string[]; // Show only if other fields are filled
  aiExtractable?: boolean; // Can AI extract this from stories
  followUps?: string[]; // Questions that might unlock based on answer
  dateRange?: {min: string, max: string}; // For date pickers
  maxImages?: number; // For multi-image uploads
}

export interface QuestionPhase {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  requiredPoints: number;
  benefits: string[];
  questions: SmartQuestion[];
}

// Progressive phases with story-based questions
export const questionPhases: QuestionPhase[] = [
  {
    id: 'essential',
    name: 'Get Started',
    description: 'Just the basics to begin your journey',
    estimatedTime: '2-3 minutes',
    requiredPoints: 0,
    benefits: ['Create your profile', 'Start browsing'],
    questions: [
      // NOTE: full_name, username, date_of_birth, current_location, gender are collected during registration
      // and should be automatically saved, so they're excluded from progressive profile questions
      {
        id: 'family_stories',
        question: 'Tell me about stories your family shared with you',
        placeholder: 'Stories your father, grandfather, uncles, aunts told you about your family history, heritage, or traditions...',
        type: 'story',
        field: 'family_stories',
        required: true,
        phase: 'essential',
        category: 'stories'
      }
    ]
  },
  {
    id: 'core',
    name: 'Childhood & Family',
    description: 'Share your childhood memories and family details',
    estimatedTime: '5-7 minutes',
    requiredPoints: 20,
    benefits: ['Better matches', 'See who viewed you', 'Advanced filters'],
    questions: [
      {
        id: 'childhood_nickname',
        question: 'Did you have a nickname when you were a child?',
        placeholder: 'What did your family and friends call you growing up?',
        type: 'text',
        field: 'childhood_nickname',
        required: false,
        phase: 'core',
        category: 'personal'
      },
      {
        id: 'childhood_friends',
        question: 'Who were your close childhood friends?',
        placeholder: 'Tell me about your childhood friends - their names and any special memories...',
        type: 'story',
        field: 'childhood_friends',
        required: false,
        phase: 'core',
        category: 'personal'
      },
      {
        id: 'childhood_memories',
        question: 'Share your favorite childhood memories',
        placeholder: 'Special moments, games you played, places you lived, family trips, traditions...',
        type: 'story',
        field: 'childhood_memories',
        required: true,
        phase: 'core',
        category: 'stories'
      },
      {
        id: 'father_name',
        question: 'What\'s your father\'s full name?',
        placeholder: 'Enter your father\'s name',
        type: 'text',
        field: 'father_name',
        required: true,
        phase: 'core',
        category: 'family'
      },
      {
        id: 'mother_name',
        question: 'What\'s your mother\'s full name?',
        placeholder: 'Enter your mother\'s name',
        type: 'text',
        field: 'mother_name',
        required: true,
        phase: 'core',
        category: 'family'
      },
      {
        id: 'siblings_relatives',
        question: 'Tell me about your siblings and relatives',
        placeholder: 'Names of your brothers, sisters, uncles, aunts, cousins, or other family members you\'re close to...',
        type: 'story',
        field: 'siblings_relatives',
        required: false,
        phase: 'core',
        category: 'family'
      }
    ]
  },
  {
    id: 'rich',
    name: 'Education & Languages',
    description: 'Tell me about your school life and languages',
    estimatedTime: '6-8 minutes',
    requiredPoints: 80,
    benefits: ['Premium matching', 'Family tree insights', 'Priority support', 'Advanced analytics'],
    questions: [
      {
        id: 'kindergarten_memories',
        question: 'Tell me about your kindergarten days',
        placeholder: 'What do you remember about kindergarten? Friends, teachers, activities...',
        type: 'story',
        field: 'kindergarten_memories',
        required: false,
        phase: 'rich',
        category: 'stories'
      },
      {
        id: 'primary_school',
        question: 'What about your primary/elementary school?',
        placeholder: 'School name, friends you made, favorite subjects, memorable moments...',
        type: 'story',
        field: 'primary_school',
        required: false,
        phase: 'rich',
        category: 'stories'
      },
      {
        id: 'secondary_school',
        question: 'Share your secondary/high school experience',
        placeholder: 'School name, close friends, subjects you loved, activities, graduation memories...',
        type: 'story',
        field: 'secondary_school',
        required: false,
        phase: 'rich',
        category: 'stories'
      },
      {
        id: 'university_college',
        question: 'Tell me about your university or college experience',
        placeholder: 'Institution name, course of study, friends, professors, campus life...',
        type: 'story',
        field: 'university_college',
        required: false,
        phase: 'rich',
        category: 'stories'
      },
      {
        id: 'languages_dialects',
        question: 'What languages, dialects, or tribal languages do you speak?',
        placeholder: 'List all languages, dialects, tribal languages you speak or understand, including your fluency level...',
        type: 'story',
        field: 'languages_dialects',
        required: true,
        phase: 'rich',
        category: 'personal'
      },
      {
        id: 'personal_bio',
        question: 'Finally, write a short bio about yourself',
        placeholder: 'Tell people about your personality, interests, what makes you unique, your dreams...',
        type: 'story',
        field: 'personal_bio',
        required: true,
        phase: 'rich',
        category: 'bio'
      },
      {
        id: 'profession',
        question: 'What is your profession or occupation?',
        placeholder: 'Your current job, career, or field of work...',
        type: 'text',
        field: 'profession',
        required: true,
        phase: 'rich',
        category: 'personal'
      },
      {
        id: 'hobbies',
        question: 'What are your hobbies and interests?',
        placeholder: 'Sports, music, reading, cooking, traveling, etc...',
        type: 'multiline',
        field: 'hobbies',
        required: false,
        phase: 'rich',
        category: 'personal'
      },
      {
        id: 'religious_background',
        question: 'What is your religious or spiritual background?',
        placeholder: 'Your faith, beliefs, or spiritual practices...',
        type: 'text',
        field: 'religious_background',
        required: false,
        phase: 'rich',
        category: 'personal'
      },
      {
        id: 'family_traditions',
        question: 'Tell me about your family traditions and customs',
        placeholder: 'Cultural celebrations, holiday traditions, family customs that are special to your family...',
        type: 'story',
        field: 'family_traditions',
        required: false,
        phase: 'rich',
        category: 'family'
      },
      {
        id: 'educational_background',
        question: 'Describe your educational journey in detail',
        placeholder: 'Your complete education path, achievements, favorite subjects, academic experiences...',
        type: 'story',
        field: 'educational_background',
        required: false,
        phase: 'rich',
        category: 'stories'
      }
    ]
  }
];

// Smart categorization for AI extraction
export const aiExtractionCategories = {
  basic: ['age', 'location', 'occupation', 'education_level'],
  family: ['heritage', 'cultural_background', 'family_size', 'traditions'],
  personal: ['interests', 'hobbies', 'values', 'personality_traits'],
  stories: ['migration_history', 'family_business', 'memorable_events'],
  preferences: ['connection_type', 'relationship_goals', 'communication_style']
};

// Helper functions
export const getNextPhase = (currentPoints: number): QuestionPhase | null => {
  return questionPhases.find(phase => phase.requiredPoints > currentPoints) || null;
};

export const getCurrentPhase = (currentPoints: number): QuestionPhase => {
  const phases = [...questionPhases].reverse();
  return phases.find(phase => currentPoints >= phase.requiredPoints) || questionPhases[0];
};

export const getCompletionPercentage = (answeredQuestions: string[], currentPhase: string): number => {
  // Calculate completion based on ALL questions across ALL phases, not just current phase
  const allQuestions = questionPhases.flatMap(phase => phase.questions);
  const answered = allQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  return Math.round((answered / allQuestions.length) * 100);
};

// Get total number of questions across all phases
export const getTotalQuestions = (): number => {
  return questionPhases.flatMap(phase => phase.questions).length;
};

// Check if profile is truly complete (100% of all questions answered)
export const isProfileComplete = (answeredQuestions: string[]): boolean => {
  const allQuestions = questionPhases.flatMap(phase => phase.questions);
  const requiredQuestions = allQuestions.filter(q => q.required);
  const answered = allQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  const requiredAnswered = requiredQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  
  // Profile is complete if all required questions + at least 90% of optional questions are answered
  return requiredAnswered === requiredQuestions.length && answered >= (allQuestions.length * 0.9);
};