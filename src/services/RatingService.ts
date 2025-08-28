import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import logger from './LoggingService';

interface RatingData {
  hasRated: boolean;
  ratingPromptCount: number;
  lastPromptDate: string | null;
  installDate: string;
  appLaunchCount: number;
  significantEventsCount: number;
}

class RatingService {
  private readonly STORAGE_KEY = 'app_rating_data';
  private readonly MIN_DAYS_BEFORE_PROMPT = 3;
  private readonly MIN_LAUNCHES_BEFORE_PROMPT = 10;
  private readonly MIN_SIGNIFICANT_EVENTS = 5;
  private readonly MAX_PROMPTS = 3;
  private readonly DAYS_BETWEEN_PROMPTS = 14;

  async initialize(): Promise<void> {
    try {
      const data = await this.getRatingData();
      
      // Increment app launch count
      data.appLaunchCount += 1;
      
      await this.saveRatingData(data);
      logger.info('Rating service initialized', { launchCount: data.appLaunchCount });
    } catch (error) {
      logger.error('Failed to initialize rating service:', error);
    }
  }

  async recordSignificantEvent(eventType: string): Promise<void> {
    try {
      const data = await this.getRatingData();
      data.significantEventsCount += 1;
      
      await this.saveRatingData(data);
      logger.debug('Significant event recorded', { eventType, totalEvents: data.significantEventsCount });
    } catch (error) {
      logger.error('Failed to record significant event:', error);
    }
  }

  async shouldShowRatingPrompt(): Promise<boolean> {
    try {
      const data = await this.getRatingData();
      
      // Don't show if user already rated
      if (data.hasRated) {
        return false;
      }

      // Don't show if max prompts reached
      if (data.ratingPromptCount >= this.MAX_PROMPTS) {
        return false;
      }

      // Check if enough time has passed since install
      const daysSinceInstall = this.getDaysDifference(data.installDate, new Date().toISOString());
      if (daysSinceInstall < this.MIN_DAYS_BEFORE_PROMPT) {
        return false;
      }

      // Check if user has launched app enough times
      if (data.appLaunchCount < this.MIN_LAUNCHES_BEFORE_PROMPT) {
        return false;
      }

      // Check if user has performed significant events
      if (data.significantEventsCount < this.MIN_SIGNIFICANT_EVENTS) {
        return false;
      }

      // Check if enough time has passed since last prompt
      if (data.lastPromptDate) {
        const daysSinceLastPrompt = this.getDaysDifference(data.lastPromptDate, new Date().toISOString());
        if (daysSinceLastPrompt < this.DAYS_BETWEEN_PROMPTS) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error checking if should show rating prompt:', error);
      return false;
    }
  }

  async showRatingPrompt(): Promise<void> {
    try {
      // Check if native rating is available first
      const isAvailable = await StoreReview.isAvailableAsync();
      
      const data = await this.getRatingData();
      
      if (isAvailable) {
        // Update prompt data ONLY when we successfully show the prompt
        data.ratingPromptCount += 1;
        data.lastPromptDate = new Date().toISOString();
        await this.saveRatingData(data);
        
        // Show native rating dialog
        await StoreReview.requestReview();
        logger.info('Native rating prompt shown');
        
        // Assume user rated if native prompt was shown
        data.hasRated = true;
        await this.saveRatingData(data);
      } else {
        // Don't increment count here - let the manual prompt handle it
        return Promise.reject(new Error('Native rating not available'));
      }
    } catch (error) {
      logger.error('Error showing rating prompt:', error);
      throw error;
    }
  }

  async markAsRated(): Promise<void> {
    try {
      const data = await this.getRatingData();
      data.hasRated = true;
      await this.saveRatingData(data);
      logger.info('User marked as rated');
    } catch (error) {
      logger.error('Failed to mark as rated:', error);
    }
  }

  async openAppStore(): Promise<void> {
    try {
      const storeUrl = await StoreReview.storeUrl();
      if (storeUrl) {
        const { Linking } = await import('react-native');
        await Linking.openURL(storeUrl);
        logger.info('App store opened for rating');
        
        // Mark as rated since user went to store
        await this.markAsRated();
      } else {
        throw new Error('Store URL not available');
      }
    } catch (error) {
      logger.error('Failed to open app store:', error);
      throw error;
    }
  }

  async getRatingData(): Promise<RatingData> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default data for new users
      const defaultData: RatingData = {
        hasRated: false,
        ratingPromptCount: 0,
        lastPromptDate: null,
        installDate: new Date().toISOString(),
        appLaunchCount: 0,
        significantEventsCount: 0,
      };

      await this.saveRatingData(defaultData);
      return defaultData;
    } catch (error) {
      logger.error('Failed to get rating data:', error);
      // Return safe default
      return {
        hasRated: false,
        ratingPromptCount: 0,
        lastPromptDate: null,
        installDate: new Date().toISOString(),
        appLaunchCount: 0,
        significantEventsCount: 0,
      };
    }
  }

  private async saveRatingData(data: RatingData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save rating data:', error);
    }
  }

  private getDaysDifference(dateString1: string, dateString2: string): number {
    const date1 = new Date(dateString1);
    const date2 = new Date(dateString2);
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Get rating statistics for debugging
  async getRatingStats(): Promise<RatingData> {
    return this.getRatingData();
  }

  // Reset rating data (for testing)
  async resetRatingData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      logger.info('Rating data reset');
    } catch (error) {
      logger.error('Failed to reset rating data:', error);
    }
  }
}

export const ratingService = new RatingService();
export default ratingService;