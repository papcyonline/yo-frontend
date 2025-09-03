// /completeprofile/personalDetailsQuestions.ts
export interface QuestionGroup {
  id: string;
  title: string;
  endpoint: string;
  color: string;
  icon: string;
  questions: Question[];
}

export interface Question {
  field: string;
  question: string;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'date' | 'select' | 'multiline';
  options?: string[];
}

export const questionGroups: QuestionGroup[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    endpoint: '/api/users/profile/basic',
    color: '#0091ad',
    icon: 'person-outline',
    questions: [
      {
        field: 'username',
        question: "What would you like your username to be?",
        placeholder: "Choose a unique username",
        required: true,
        type: 'text'
      },
      {
        field: 'childhood_nickname',
        question: "What was your childhood nickname?",
        placeholder: "Any nickname you had as a child",
        type: 'text'
      },
      {
        field: 'location',
        question: "Where do you currently live?",
        placeholder: "City, Country",
        required: true,
        type: 'text'
      }
    ]
  },
  {
    id: 'family',
    title: 'Family Information',
    endpoint: '/api/users/profile/family',
    color: '#04a7c7',
    icon: 'people-outline',
    questions: [
      {
        field: 'heritage',
        question: "What's your family heritage or cultural background?",
        placeholder: "e.g., Lebanese, Egyptian, mixed heritage",
        required: true,
        type: 'text'
      },
      {
        field: 'family_size',
        question: "How would you describe your family size?",
        placeholder: "Select family size",
        type: 'select',
        options: ['small', 'medium', 'large', 'very_large']
      },
      {
        field: 'traditions',
        question: "What family traditions are important to you?",
        placeholder: "e.g., family dinners, holidays, cultural celebrations",
        type: 'multiline'
      }
    ]
  },
  {
    id: 'personal',
    title: 'Personal Details',
    endpoint: '/api/users/profile/personal',
    color: '#fcd3aa',
    icon: 'heart-outline',
    questions: [
      {
        field: 'occupation',
        question: "What's your occupation?",
        placeholder: "Your job or profession",
        type: 'text'
      },
      {
        field: 'company',
        question: "Where do you work?",
        placeholder: "Company or organization name",
        type: 'text'
      },
      {
        field: 'hobbies',
        question: "What are your hobbies and interests?",
        placeholder: "e.g., reading, cooking, sports",
        type: 'multiline'
      }
    ]
  },
  {
    id: 'education',
    title: 'Education Background',
    endpoint: '/api/users/profile/education',
    color: '#0091ad',
    icon: 'school-outline',
    questions: [
      {
        field: 'high_school',
        question: "What high school did you attend?",
        placeholder: "High school name and location",
        type: 'text'
      },
      {
        field: 'university',
        question: "Did you attend university or college?",
        placeholder: "University name",
        type: 'text'
      },
      {
        field: 'degree',
        question: "What did you study?",
        placeholder: "Your degree or field of study",
        type: 'text'
      }
    ]
  },
  {
    id: 'stories',
    title: 'Family Stories',
    endpoint: '/api/users/profile/stories',
    color: '#04a7c7',
    icon: 'book-outline',
    questions: [
      {
        field: 'migration_story',
        question: "Do you know any stories about how your family came to where you live now?",
        placeholder: "Share any migration or settlement stories",
        type: 'multiline'
      },
      {
        field: 'family_business',
        question: "Did your family have any businesses or trades passed down through generations?",
        placeholder: "Family businesses, trades, or professions",
        type: 'multiline'
      },
      {
        field: 'memorable_relatives',
        question: "Tell us about any memorable relatives or ancestors",
        placeholder: "Stories about grandparents, uncles, or other relatives",
        type: 'multiline'
      }
    ]
  }
];

export const getCategoryColor = (categoryId: string) => {
  const group = questionGroups.find(g => g.id === categoryId);
  return group?.color || '#0091ad';
};

export const getCategoryIcon = (categoryId: string) => {
  const group = questionGroups.find(g => g.id === categoryId);
  return group?.icon || 'help-outline';
};