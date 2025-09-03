// src/services/questionService.ts
import { authApi } from './api/auth';

interface ProcessAnswerRequest {
  question: string;
  rawAnswer: string;
  userId: string;
}

interface SaveAnswersRequest {
  userId: string;
  answers: string[];
  method: 'typing' | 'voice';
  conversationLog?: Array<{type: 'ai' | 'user', message: string}>;
}

class QuestionService {
  private openAiApiKey: string;

  constructor() {
    // Add your OpenAI API key here
    this.openAiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
  }

  async processAnswer(request: ProcessAnswerRequest): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a family heritage assistant helping to process and clean up user responses to family questions. 

Your task is to:
1. Clean up the raw transcribed text (fix grammar, remove filler words, etc.)
2. Extract the key information that answers the question
3. Format it as a clear, coherent response
4. Maintain the user's authentic voice and personal details
5. If the answer is incomplete or unclear, note what additional information might be helpful

Do not add information that wasn't provided by the user. Keep their personal tone and style.

Question being answered: "${request.question}"`
            },
            {
              role: 'user',
              content: `Please process this raw answer and make it clear and well-formatted while preserving the user's authentic voice:

Raw answer: "${request.rawAnswer}"`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const processedAnswer = data.choices[0]?.message?.content;

      if (!processedAnswer) {
        throw new Error('No processed answer received from OpenAI');
      }

      return processedAnswer.trim();
    } catch (error) {
      console.error('Error processing answer with OpenAI:', error);
      // Fallback: return the raw answer if processing fails
      return request.rawAnswer;
    }
  }

  async generateFollowUpQuestions(answer: string, originalQuestion: string): Promise<string[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a family heritage assistant. Based on a user's answer to a family question, generate 2-3 thoughtful follow-up questions that would help them provide more detail or explore related aspects of their story.

Make the questions conversational and encouraging. Focus on helping them share more meaningful details about their family, traditions, experiences, or feelings.

Original question: "${originalQuestion}"`
            },
            {
              role: 'user',
              content: `The user answered: "${answer}"

Generate 2-3 follow-up questions to help them elaborate or share more details.`
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const followUpText = data.choices[0]?.message?.content;

      if (!followUpText) {
        return [];
      }

      // Parse the response to extract individual questions
      const questions = followUpText
        .split(/\d+\.|\n/)
        .map(q => q.trim())
        .filter(q => q.length > 10 && q.includes('?'));

      return questions.slice(0, 3); // Return max 3 questions
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  async saveAnswers(request: SaveAnswersRequest): Promise<void> {
    try {
      const response = await authApi.saveProfileAnswers({
        userId: request.userId,
        answers: request.answers,
        method: request.method,
        conversationLog: request.conversationLog,
        completedAt: new Date().toISOString()
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save answers');
      }
    } catch (error) {
      console.error('Error saving answers:', error);
      throw error;
    }
  }

  async extractKeyInsights(answers: string[]): Promise<{
    personality: string[];
    interests: string[];
    familyValues: string[];
    culturalBackground: string[];
  }> {
    try {
      const combinedAnswers = answers.join('\n\n');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a family heritage analyst. Analyze the user's responses to family questions and extract key insights about their:

1. Personality traits and characteristics
2. Interests and hobbies
3. Family values and what's important to them
4. Cultural background and heritage

Return the analysis in JSON format with arrays for each category. Each array should contain 3-5 short, specific insights.

Example format:
{
  "personality": ["family-oriented", "creative", "adventurous"],
  "interests": ["cooking", "travel", "music"],
  "familyValues": ["tradition", "togetherness", "education"],
  "culturalBackground": ["Italian heritage", "Mediterranean traditions", "bilingual household"]
}`
            },
            {
              role: 'user',
              content: `Analyze these family question responses:

${combinedAnswers}`
            }
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const insightsText = data.choices[0]?.message?.content;

      if (!insightsText) {
        throw new Error('No insights received from OpenAI');
      }

      try {
        return JSON.parse(insightsText);
      } catch (parseError) {
        console.error('Error parsing insights JSON:', parseError);
        // Return empty structure if parsing fails
        return {
          personality: [],
          interests: [],
          familyValues: [],
          culturalBackground: []
        };
      }
    } catch (error) {
      console.error('Error extracting insights:', error);
      return {
        personality: [],
        interests: [],
        familyValues: [],
        culturalBackground: []
      };
    }
  }

  // Predefined questions for the family profile setup
  getDefaultQuestions(): string[] {
    return [
      "Tell me about yourself and your background.",
      "What's your family heritage and where are your roots?",
      "What are some family traditions that are important to you?",
      "What hobbies or interests do you enjoy?",
      "What would you like your family to know about you?"
    ];
  }

  // Helper method to validate if an answer is complete enough
  isAnswerComplete(answer: string): boolean {
    const trimmedAnswer = answer.trim();
    return trimmedAnswer.length >= 20 && trimmedAnswer.split(' ').length >= 5;
  }

  // Helper method to get question suggestions based on incomplete answers
  getQuestionSuggestions(questionIndex: number): string[] {
    const suggestions = [
      [
        "What's your profession or what do you do for work?",
        "Where did you grow up?",
        "What are some of your core values or beliefs?"
      ],
      [
        "Which country or region did your family originally come from?",
        "Do you speak any languages other than English?",
        "Are there any family stories passed down through generations?"
      ],
      [
        "Do you celebrate any specific holidays or festivals?",
        "Are there any special foods or recipes in your family?",
        "Do you have any family rituals or customs?"
      ],
      [
        "What do you like to do in your free time?",
        "Do you have any creative pursuits or talents?",
        "What kind of activities bring you joy?"
      ],
      [
        "What values would you want to pass down to future generations?",
        "What makes you proud of your family?",
        "What legacy would you like to leave?"
      ]
    ];

    return suggestions[questionIndex] || [];
  }
}

export const questionService = new QuestionService();