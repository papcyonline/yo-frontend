// Service to automatically save registration data to progressive profile
import { API_CONFIG } from '../constants/api';

interface RegistrationData {
  userInfo?: {
    fullName: string;
    username: string;
    dateOfBirth: Date | null;
    location: string;
    gender: string;
  };
  userData?: any;
}

export const saveRegistrationToProfile = async (token: string, data: RegistrationData) => {
  try {
    console.log('🔄 Saving registration data to progressive profile...');
    console.log('📋 Raw data received:', JSON.stringify(data, null, 2));
    
    // Prepare the registration data for progressive profile
    const registrationAnswers: Record<string, any> = {};
    
    // Extract data from userInfo (from registration form) or userData (from backend)
    const userInfo = data.userInfo;
    const userData = data.userData;
    
    console.log('👤 UserInfo data:', JSON.stringify(userInfo, null, 2));
    console.log('📊 UserData:', JSON.stringify(userData, null, 2));
    
    if (userInfo) {
      // Data from registration form
      registrationAnswers.full_name = userInfo.fullName;
      registrationAnswers.username = userInfo.username;
      registrationAnswers.date_of_birth = userInfo.dateOfBirth?.toISOString().split('T')[0]; // YYYY-MM-DD format
      registrationAnswers.location = userInfo.location;
      registrationAnswers.gender = userInfo.gender;
    } else if (userData) {
      // Data from backend user object
      const fullName = userData.fullName || `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim();
      registrationAnswers.full_name = fullName;
      registrationAnswers.username = userData.username || '';
      registrationAnswers.date_of_birth = userData.dateOfBirth || userData.date_of_birth || '';
      registrationAnswers.location = userData.location || userData.current_address || '';
    }
    
    // Only save if we have actual data
    if (Object.keys(registrationAnswers).length === 0) {
      console.log('⚠️ No registration data to save to progressive profile');
      return { success: true, message: 'No data to save' };
    }
    
    console.log('📝 Registration data to save:', registrationAnswers);
    
    // Save to progressive profile using batch endpoint
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/progressive/save-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        answers: registrationAnswers,
        phase: 'essential',
        autoSaved: true // Flag to indicate this was auto-saved from registration
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Registration data saved to progressive profile successfully');
      return { success: true, data: result.data };
    } else {
      console.error('❌ Failed to save registration data:', result);
      return { success: false, error: result.message || 'Failed to save registration data' };
    }
    
  } catch (error) {
    console.error('❌ Error saving registration data to progressive profile:', error);
    return { success: false, error: error.message };
  }
};