// Unified Onboarding Flow - Optimized for AI Matching
// Combines registration + AI questionnaire into one seamless experience

export interface UnifiedQuestion {
  id: string;
  question: string;
  placeholder: string;
  type: 'text' | 'multiline' | 'select' | 'date' | 'story' | 'card-select' | 'image' | 'location';
  field: string;
  required: boolean;
  phase: 'essential' | 'core' | 'rich';
  category: 'auth' | 'basic' | 'family' | 'cultural' | 'social' | 'stories' | 'media';
  matchingValue: 'critical' | 'high' | 'medium' | 'low'; // AI matching importance
  options?: string[];
  validation?: string;
  helpText?: string;
}

export interface OnboardingPhase {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  requiredForApp: boolean; // Can user start using app after this phase?
  benefits: string[];
  questions: UnifiedQuestion[];
}

// 🎯 UNIFIED ONBOARDING PHASES
export const unifiedOnboardingPhases: OnboardingPhase[] = [
  {
    id: 'essential',
    name: 'Get Started',
    description: 'Essential info to create your account and enable basic matching',
    estimatedTime: '3-4 minutes',
    requiredForApp: true,
    benefits: ['Create account', 'Basic family matching', 'Start browsing'],
    questions: [
      // AUTHENTICATION & BASIC INFO
      {
        id: 'email',
        question: 'What\'s your email address?',
        placeholder: 'Enter your email',
        type: 'text',
        field: 'email',
        required: true,
        phase: 'essential',
        category: 'auth',
        matchingValue: 'low',
        validation: 'email'
      },
      {
        id: 'phone',
        question: 'What\'s your phone number?',
        placeholder: 'Enter your phone number',
        type: 'text',
        field: 'phone',
        required: true,
        phase: 'essential',
        category: 'auth',
        matchingValue: 'low'
      },
      {
        id: 'full_name',
        question: 'What\'s your full name?',
        placeholder: 'Enter your full name',
        type: 'text',
        field: 'full_name',
        required: true,
        phase: 'essential',
        category: 'basic',
        matchingValue: 'critical',
        helpText: 'This helps us find family members and relatives'
      },
      {
        id: 'username',
        question: 'Choose a username',
        placeholder: 'Choose a unique username',
        type: 'text',
        field: 'username',
        required: true,
        phase: 'essential',
        category: 'basic',
        matchingValue: 'low'
      },
      {
        id: 'date_of_birth',
        question: 'When were you born?',
        placeholder: 'Select your date of birth',
        type: 'date',
        field: 'date_of_birth',
        required: true,
        phase: 'essential',
        category: 'basic',
        matchingValue: 'high',
        helpText: 'Helps us match you with people of similar age'
      },
      {
        id: 'gender',
        question: 'What\'s your gender?',
        placeholder: 'Select your gender',
        type: 'select',
        field: 'gender',
        required: false,
        phase: 'essential',
        category: 'basic',
        matchingValue: 'medium',
        options: ['Male', 'Female', 'Other', 'Prefer not to say']
      },
      {
        id: 'current_location',
        question: 'Where do you currently live?',
        placeholder: 'City, Country',
        type: 'location',
        field: 'current_location',
        required: true,
        phase: 'essential',
        category: 'basic',
        matchingValue: 'high',
        helpText: 'Find people in your area'
      },
      
      // 🔥 CRITICAL FAMILY MATCHING DATA
      {
        id: 'father_name',
        question: 'What is your father\'s full name?',
        placeholder: 'Enter your father\'s full name',
        type: 'text',
        field: 'father_name',
        required: true,
        phase: 'essential',
        category: 'family',
        matchingValue: 'critical',
        helpText: 'Essential for finding family members and siblings'
      },
      {
        id: 'mother_name',
        question: 'What is your mother\'s full name?',
        placeholder: 'Enter your mother\'s full name',
        type: 'text',
        field: 'mother_name',
        required: true,
        phase: 'essential',
        category: 'family',
        matchingValue: 'critical',
        helpText: 'Essential for finding family members and siblings'
      },
      {
        id: 'family_origin',
        question: 'Where is your family originally from?',
        placeholder: 'City, region, or country of family origin',
        type: 'text',
        field: 'family_origin',
        required: true,
        phase: 'essential',
        category: 'cultural',
        matchingValue: 'critical',
        helpText: 'Connects you with people from your ancestral homeland'
      },
      {
        id: 'primary_language',
        question: 'What is your primary language?',
        placeholder: 'Your main language',
        type: 'text',
        field: 'primary_language',
        required: true,
        phase: 'essential',
        category: 'cultural',
        matchingValue: 'high',
        helpText: 'Find people who speak your language'
      }
    ]
  },
  
  {
    id: 'core',
    name: 'Build Your Profile',
    description: 'Add details that help us find better matches and connections',
    estimatedTime: '5-7 minutes',
    requiredForApp: false,
    benefits: ['Better family matching', 'Friend connections', 'Community discovery'],
    questions: [
      // ENHANCED FAMILY DATA
      {
        id: 'siblings_names',
        question: 'What are your siblings\' names?',
        placeholder: 'List your brothers and sisters (optional)',
        type: 'multiline',
        field: 'siblings_names',
        required: false,
        phase: 'core',
        category: 'family',
        matchingValue: 'high',
        helpText: 'Helps find siblings and extended family'
      },
      {
        id: 'family_languages',
        question: 'What languages does your family speak?',
        placeholder: 'List all languages, dialects, or tribal languages',
        type: 'multiline',
        field: 'family_languages',
        required: false,
        phase: 'core',
        category: 'cultural',
        matchingValue: 'high',
        helpText: 'Important for cultural and regional connections'
      },
      
      // SOCIAL & EDUCATIONAL CONNECTIONS
      {
        id: 'previous_locations',
        question: 'Where have you lived before?',
        placeholder: 'Previous cities or places you\'ve lived',
        type: 'multiline',
        field: 'previous_locations',
        required: false,
        phase: 'core',
        category: 'social',
        matchingValue: 'high',
        helpText: 'Connect with people from places you\'ve lived'
      },
      {
        id: 'schools_attended',
        question: 'What schools did you attend?',
        placeholder: 'Primary school, high school, university names',
        type: 'multiline',
        field: 'schools_attended',
        required: false,
        phase: 'core',
        category: 'social',
        matchingValue: 'high',
        helpText: 'Find former classmates and school friends'
      },
      {
        id: 'profession',
        question: 'What do you do for work?',
        placeholder: 'Your profession or field of work',
        type: 'text',
        field: 'profession',
        required: false,
        phase: 'core',
        category: 'social',
        matchingValue: 'medium',
        helpText: 'Connect with people in your industry'
      },
      
      // CULTURAL & COMMUNITY DATA
      {
        id: 'cultural_background',
        question: 'What\'s your cultural or ethnic background?',
        placeholder: 'Your cultural, ethnic, or tribal identity',
        type: 'text',
        field: 'cultural_background',
        required: false,
        phase: 'core',
        category: 'cultural',
        matchingValue: 'high',
        helpText: 'Find people who share your cultural heritage'
      },
      {
        id: 'religious_background',
        question: 'What\'s your religious or spiritual background?',
        placeholder: 'Your faith, beliefs, or spiritual practices',
        type: 'text',
        field: 'religious_background',
        required: false,
        phase: 'core',
        category: 'cultural',
        matchingValue: 'medium',
        helpText: 'Connect with people who share your beliefs'
      },
      {
        id: 'family_traditions',
        question: 'What traditions does your family practice?',
        placeholder: 'Cultural traditions, celebrations, or customs',
        type: 'multiline',
        field: 'family_traditions',
        required: false,
        phase: 'core',
        category: 'cultural',
        matchingValue: 'medium',
        helpText: 'Find people who share similar traditions'
      }
    ]
  },
  
  {
    id: 'rich',
    name: 'Share Your Story',
    description: 'Tell your story and unlock premium matching features',
    estimatedTime: '6-8 minutes',
    requiredForApp: false,
    benefits: ['Premium matching', 'Detailed connections', 'Family tree insights'],
    questions: [
      // PERSONAL STORY & BIO
      {
        id: 'personal_bio',
        question: 'Tell us about yourself',
        placeholder: 'Share your personality, interests, what makes you unique...',
        type: 'story',
        field: 'personal_bio',
        required: false,
        phase: 'rich',
        category: 'stories',
        matchingValue: 'medium',
        helpText: 'Help people understand who you are'
      },
      {
        id: 'childhood_nickname',
        question: 'Did you have a nickname growing up?',
        placeholder: 'What did family and friends call you?',
        type: 'text',
        field: 'childhood_nickname',
        required: false,
        phase: 'rich',
        category: 'stories',
        matchingValue: 'medium'
      },
      
      // DETAILED FAMILY STORIES
      {
        id: 'family_stories',
        question: 'Share a story about your family',
        placeholder: 'Family history, traditions, memorable moments...',
        type: 'story',
        field: 'family_stories',
        required: false,
        phase: 'rich',
        category: 'stories',
        matchingValue: 'high',
        helpText: 'Stories often contain names and details that help matching'
      },
      {
        id: 'migration_history',
        question: 'Tell us about your family\'s journey',
        placeholder: 'How did your family come to live where they are now?',
        type: 'story',
        field: 'migration_history',
        required: false,
        phase: 'rich',
        category: 'stories',
        matchingValue: 'high',
        helpText: 'Migration patterns help find family connections'
      },
      
      // EDUCATIONAL & SOCIAL DETAILS
      {
        id: 'childhood_memories',
        question: 'Share your favorite childhood memories',
        placeholder: 'Special moments, places you lived, friends you had...',
        type: 'story',
        field: 'childhood_memories',
        required: false,
        phase: 'rich',
        category: 'stories',
        matchingValue: 'medium'
      },
      {
        id: 'hobbies_interests',
        question: 'What are your hobbies and interests?',
        placeholder: 'Sports, music, reading, cooking, traveling...',
        type: 'multiline',
        field: 'hobbies_interests',
        required: false,
        phase: 'rich',
        category: 'social',
        matchingValue: 'low'
      },
      
      // MEDIA & VISUAL
      {
        id: 'profile_picture',
        question: 'Add your profile photo',
        placeholder: 'Upload your main profile picture',
        type: 'image',
        field: 'profile_picture_url',
        required: false,
        phase: 'rich',
        category: 'media',
        matchingValue: 'low'
      }
    ]
  }
];

// HELPER FUNCTIONS
export const getTotalQuestions = (): number => {
  return unifiedOnboardingPhases.flatMap(phase => phase.questions).length;
};

export const getEssentialQuestions = (): UnifiedQuestion[] => {
  return unifiedOnboardingPhases.find(phase => phase.id === 'essential')?.questions || [];
};

export const getCriticalMatchingQuestions = (): UnifiedQuestion[] => {
  return unifiedOnboardingPhases
    .flatMap(phase => phase.questions)
    .filter(q => q.matchingValue === 'critical');
};

export const getQuestionsByMatchingValue = (value: 'critical' | 'high' | 'medium' | 'low'): UnifiedQuestion[] => {
  return unifiedOnboardingPhases
    .flatMap(phase => phase.questions)
    .filter(q => q.matchingValue === value);
};

export const calculateUnifiedCompletion = (answeredQuestions: string[]): {
  percentage: number;
  isComplete: boolean;
  essentialComplete: boolean;
  coreComplete: boolean;
  richComplete: boolean;
} => {
  const allQuestions = unifiedOnboardingPhases.flatMap(phase => phase.questions);
  const essentialQuestions = unifiedOnboardingPhases.find(p => p.id === 'essential')?.questions || [];
  const coreQuestions = unifiedOnboardingPhases.find(p => p.id === 'core')?.questions || [];
  const richQuestions = unifiedOnboardingPhases.find(p => p.id === 'rich')?.questions || [];
  
  const answeredCount = allQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  const essentialAnswered = essentialQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  const coreAnswered = coreQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  const richAnswered = richQuestions.filter(q => answeredQuestions.includes(q.id)).length;
  
  // Weighted completion: Essential 50%, Core 30%, Rich 20%
  const essentialPercent = (essentialAnswered / essentialQuestions.length) * 50;
  const corePercent = (coreAnswered / coreQuestions.length) * 30;
  const richPercent = (richAnswered / richQuestions.length) * 20;
  
  const totalPercentage = Math.round(essentialPercent + corePercent + richPercent);
  
  return {
    percentage: Math.min(totalPercentage, 100),
    isComplete: totalPercentage >= 90,
    essentialComplete: essentialAnswered >= essentialQuestions.filter(q => q.required).length,
    coreComplete: coreAnswered >= coreQuestions.length * 0.7, // 70% of core questions
    richComplete: richAnswered >= richQuestions.length * 0.5  // 50% of rich questions
  };
};

export const getNextRecommendedQuestion = (answeredQuestions: string[]): UnifiedQuestion | null => {
  // Prioritize critical matching questions first
  const criticalQuestions = getCriticalMatchingQuestions();
  const unansweredCritical = criticalQuestions.filter(q => !answeredQuestions.includes(q.id));
  
  if (unansweredCritical.length > 0) {
    return unansweredCritical[0];
  }
  
  // Then high-value questions
  const highValueQuestions = getQuestionsByMatchingValue('high');
  const unansweredHigh = highValueQuestions.filter(q => !answeredQuestions.includes(q.id));
  
  if (unansweredHigh.length > 0) {
    return unansweredHigh[0];
  }
  
  // Finally, any remaining questions
  const allQuestions = unifiedOnboardingPhases.flatMap(phase => phase.questions);
  const unansweredAny = allQuestions.filter(q => !answeredQuestions.includes(q.id));
  
  return unansweredAny[0] || null;
};