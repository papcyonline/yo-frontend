// CompleteProfile/personalDetails.ts
import { API_CONFIG } from '../../constants/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface PersonalDetailsData {
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  currentAddress: string;
  fatherName: string;
  motherName: string;
  siblings: string;
  bio: string;
  familyOriginStories: string;
  grandfatherStories: string;
  uncleStories: string;
  familyTraditions: string;
  primarySchool: string;
  highSchool: string;
  university: string;
  closeSchoolFriends: string;
  hobbies: string;
  profession: string;
  languages: string;
  religiousBackground: string;
  profilePhoto?: any;
  familyPhotos?: any[];
}

export const submitPersonalDetails = async (userId: string, formData: PersonalDetailsData) => {
  try {
    console.log('=== SUBMIT PERSONAL DETAILS DEBUG ===');
    console.log('API URL:', `${API_BASE_URL}/auth/save-personal-details`);
    console.log('User ID:', userId);
    console.log('Form data keys:', Object.keys(formData));

    const response = await fetch(`${API_BASE_URL}/auth/save-personal-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...formData,
        profileCompleted: true,
      }),
    });

    console.log('Response status:', response.status);

    const result = await response.json();
    console.log('=== PERSONAL DETAILS RESPONSE ===');
    console.log('Full response:', result);

    if (response.ok && result.success) {
      console.log('✅ Personal details saved successfully');
      return {
        success: true,
        message: result.message,
        data: result.data
      };
    } else {
      console.log('❌ Personal details save failed:', result);
      return {
        success: false,
        message: result.message || 'Failed to save personal details'
      };
    }
  } catch (error) {
    console.error('❌ Network/Parse error:', error);
    return {
      success: false,
      message: 'Unable to connect to server. Please check your connection.'
    };
  }
};

export const uploadProfilePhoto = async (userId: string, photoUri: string) => {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/auth/upload-profile-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        photoUrl: result.photoUrl
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to upload photo'
      };
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    return {
      success: false,
      message: 'Failed to upload photo'
    };
  }
};

export const uploadFamilyPhotos = async (userId: string, photos: string[]) => {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    
    photos.forEach((photoUri, index) => {
      formData.append('familyPhotos', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `family_${index}.jpg`,
      } as any);
    });

    const response = await fetch(`${API_BASE_URL}/auth/upload-family-photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        photoUrls: result.photoUrls
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to upload family photos'
      };
    }
  } catch (error) {
    console.error('Family photos upload error:', error);
    return {
      success: false,
      message: 'Failed to upload family photos'
    };
  }
};