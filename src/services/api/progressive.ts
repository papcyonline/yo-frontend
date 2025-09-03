import { apiService } from './index';
import { ApiResponse } from '../../types';

// Progressive Profile API Types
export interface ProgressiveProfileData {
  id: string;
  user_id: string;
  current_phase: 'essential' | 'core' | 'rich';
  total_points: number;
  answers: Record<string, any>;
  answered_questions: string[];
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
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

export interface SmartQuestion {
  id: string;
  question: string;
  placeholder: string;
  type: 'text' | 'multiline' | 'select' | 'date' | 'story' | 'card-select';
  field: string;
  required?: boolean;
  phase: 'essential' | 'core' | 'rich';
  category: 'basic' | 'family' | 'personal' | 'stories' | 'preferences';
  points: number;
  options?: string[];
  cards?: Array<{id: string, label: string, icon: string}>;
  dependencies?: string[];
  aiExtractable?: boolean;
  followUps?: string[];
}

export interface ProgressiveStatusResponse {
  profile: ProgressiveProfileData;
  currentPhase: QuestionPhase;
  nextPhase?: QuestionPhase;
}

export interface SaveAnswerResponse {
  profile: ProgressiveProfileData;
  pointsEarned: number;
  currentPhase: QuestionPhase;
  nextPhase?: QuestionPhase;
}

export interface AnswersResponse {
  answers: Record<string, any>;
  answeredQuestions: string[];
  totalPoints: number;
  currentPhase: string;
}

export interface QuestionFlowResponse {
  questionPhases: QuestionPhase[];
}

class ProgressiveProfileAPI {
  private baseURL = '/users';

  // Get progressive profile status
  async getProgressiveStatus(): Promise<ApiResponse<ProgressiveStatusResponse>> {
    return apiService.get(`${this.baseURL}/progressive/status`);
  }

  // Save a single answer
  async saveAnswer(
    questionId: string, 
    answer: any, 
    points = 0
  ): Promise<ApiResponse<SaveAnswerResponse>> {
    return apiService.post(`${this.baseURL}/progressive/save-answer`, {
      questionId,
      answer,
      points
    });
  }

  // Get all saved answers
  async getAnswers(): Promise<ApiResponse<AnswersResponse>> {
    return apiService.get(`${this.baseURL}/progressive/answers`);
  }

  // Save multiple answers in batch
  async saveBatchAnswers(answers: Record<string, any>, autoSaved: boolean = false): Promise<ApiResponse<SaveAnswerResponse>> {
    return apiService.post(`${this.baseURL}/progressive/save-batch`, {
      answers,
      autoSaved
    });
  }

  // Complete a phase
  async completePhase(phaseId: string): Promise<ApiResponse<{profile: ProgressiveProfileData}>> {
    return apiService.put(`${this.baseURL}/progressive/phase-complete`, {
      phaseId
    });
  }

  // Finalize progressive profile
  async finalizeProfile(): Promise<ApiResponse<{profile: ProgressiveProfileData, user: any}>> {
    return apiService.post(`${this.baseURL}/progressive/finalize`);
  }

  // Get question flow
  async getQuestionFlow(): Promise<ApiResponse<QuestionFlowResponse>> {
    return apiService.get(`${this.baseURL}/progressive/questions`);
  }
}

export const progressiveProfileAPI = new ProgressiveProfileAPI();