import { API_BASE_URL } from '../config/constants';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index?: number;
  is_active?: boolean;
}

export interface FeedbackData {
  feedbackType: 'bug' | 'feature' | 'improvement' | 'general' | 'compliment';
  subject: string;
  message: string;
  email: string;
  rating?: number;
  includeDeviceInfo?: boolean;
  includeLogs?: boolean;
}

class SupportService {
  private baseURL = `${API_BASE_URL}/settings`;

  async getFAQ(category?: string): Promise<FAQItem[]> {
    try {
      const url = category ? `${this.baseURL}/faq?category=${category}` : `${this.baseURL}/faq`;
      console.log('❓ Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FAQ response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 FAQ API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to get FAQ');
      }

      return data.data.faqItems;
    } catch (error) {
      console.error('❌ Get FAQ error:', error);
      // Return default FAQ if API fails
      return [
        {
          id: '1',
          question: 'How do I add family members?',
          answer: 'Go to the Family tab and tap the "+" button. You can invite family members by email or phone number.',
          category: 'family'
        },
        {
          id: '2',
          question: 'How do I change my privacy settings?',
          answer: 'Navigate to Settings > Privacy Settings. Here you can control who can see your profile and information.',
          category: 'privacy'
        },
        {
          id: '3',
          question: 'Can I delete my account?',
          answer: 'Yes, you can delete your account from Settings > Account Actions > Delete Account.',
          category: 'account'
        }
      ];
    }
  }

  async submitFeedback(token: string, feedbackData: FeedbackData): Promise<any> {
    try {
      console.log('📝 Making request to:', `${this.baseURL}/feedback`);
      
      const response = await fetch(`${this.baseURL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      console.log('📡 Feedback response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Feedback API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      return data.data.feedback;
    } catch (error) {
      console.error('❌ Submit feedback error:', error);
      throw error;
    }
  }
}

export const supportService = new SupportService();