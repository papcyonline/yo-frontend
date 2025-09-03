import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'yofam_auth_data';
const USER_STORAGE_KEY = 'yofam_user_data';

export interface AuthData {
  token: string;
  userId: string;
  email: string;
  phone: string;
  isAuthenticated: boolean;
  loginTime: number;
}

export interface UserData {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  profileCompleted: boolean;
  dateOfBirth?: string;
  placeOfBirth?: string;
  currentAddress?: string;
  fatherName?: string;
  motherName?: string;
  bio?: string;
  familyOriginStories?: string;
  grandfatherStories?: string;
  uncleStories?: string;
  familyTraditions?: string;
  primarySchool?: string;
  highSchool?: string;
  university?: string;
  closeSchoolFriends?: string;
  hobbies?: string;
  profession?: string;
  languages?: string;
  religiousBackground?: string;
}

export class AuthStorage {
  // Save authentication data
  static async saveAuthData(authData: AuthData): Promise<void> {
    try {
      const dataToStore = {
        ...authData,
        loginTime: Date.now(),
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  }

  // Get authentication data
  static async getAuthData(): Promise<AuthData | null> {
    try {
      const authDataString = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (authDataString) {
        const authData = JSON.parse(authDataString) as AuthData;
        
        // Check if login is still valid (e.g., within 30 days)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - authData.loginTime > thirtyDaysInMs;
        
        if (isExpired) {
          await this.clearAuthData();
          return null;
        }
        
        return authData;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  }

  // Save user profile data
  static async saveUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  // Get user profile data
  static async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userDataString) {
        return JSON.parse(userDataString) as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user profile data (merge with existing)
  static async updateUserData(updatedFields: Partial<UserData>): Promise<void> {
    try {
      const existingData = await this.getUserData();
      const newData = { ...existingData, ...updatedFields };
      await this.saveUserData(newData as UserData);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const authData = await this.getAuthData();
      return authData !== null && authData.isAuthenticated;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Clear all authentication data (logout)
  static async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  // Get complete stored data (auth + user)
  static async getStoredData(): Promise<{ auth: AuthData | null; user: UserData | null }> {
    try {
      const [authData, userData] = await Promise.all([
        this.getAuthData(),
        this.getUserData()
      ]);
      
      return {
        auth: authData,
        user: userData
      };
    } catch (error) {
      console.error('Error getting stored data:', error);
      return { auth: null, user: null };
    }
  }
}

// Helper function to handle login and save data
export const handleSuccessfulLogin = async (
  token: string,
  userId: string,
  email: string,
  phone: string,
  userData?: Partial<UserData>
): Promise<void> => {
  try {
    // Save authentication data
    const authData: AuthData = {
      token,
      userId,
      email,
      phone,
      isAuthenticated: true,
      loginTime: Date.now(),
    };
    await AuthStorage.saveAuthData(authData);

    // Save user data if provided
    if (userData) {
      const fullUserData: UserData = {
        id: userId,
        email,
        phone,
        fullName: userData.fullName || '',
        profileCompleted: userData.profileCompleted || false,
        ...userData,
      };
      await AuthStorage.saveUserData(fullUserData);
      
      // Also sync with Zustand store if available
      try {
        const { useAuthStore } = await import('../store/authStore');
        const { setUser, setTokens } = useAuthStore.getState();
        setUser(fullUserData);
        setTokens(token, '');
      } catch (storeError) {
        console.log('Note: Could not sync with auth store:', storeError);
        // This is non-critical, continue without failing
      }
    }
  } catch (error) {
    console.error('Error handling successful login:', error);
    throw error;
  }
};

// Helper function to handle logout
export const handleLogout = async (): Promise<void> => {
  try {
    await AuthStorage.clearAuthData();
  } catch (error) {
    console.error('Error handling logout:', error);
    throw error;
  }
};