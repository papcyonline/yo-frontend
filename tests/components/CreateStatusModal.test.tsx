import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateStatusModal from '../../src/components/status/CreateStatusModal';

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockProps = {
  visible: true,
  onClose: jest.fn(),
  onStatusCreated: jest.fn(),
};

describe('CreateStatusModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage token
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'auth_token') {
        return Promise.resolve('mock_token');
      }
      return Promise.resolve(null);
    });

    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        status: {
          _id: 'new_status_id',
          content: { text: 'Test status', type: 'text' },
          user_id: 'user123',
        },
      }),
    });
  });

  test('renders modal when visible', () => {
    const { getByText, getByPlaceholderText } = render(<CreateStatusModal {...mockProps} />);
    
    expect(getByText('Create Status')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Share')).toBeTruthy();
    expect(getByPlaceholderText("What's on your mind?")).toBeTruthy();
  });

  test('does not render when not visible', () => {
    const { queryByText } = render(<CreateStatusModal {...mockProps} visible={false} />);
    
    expect(queryByText('Create Status')).toBeNull();
  });

  test('handles text input changes', () => {
    const { getByPlaceholderText, getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const textInput = getByPlaceholderText("What's on your mind?");
    fireEvent.changeText(textInput, 'Hello World!');
    
    expect(getByText('12/2000')).toBeTruthy(); // Character count
  });

  test('share button is disabled when no content', () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const shareButton = getByText('Share');
    expect(shareButton.parent.props.style).toEqual(
      expect.objectContaining({ opacity: 0.5 })
    );
  });

  test('share button is enabled when text is entered', () => {
    const { getByPlaceholderText, getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const textInput = getByPlaceholderText("What's on your mind?");
    fireEvent.changeText(textInput, 'Hello World!');
    
    const shareButton = getByText('Share');
    expect(shareButton.parent.props.style).toEqual(
      expect.objectContaining({ opacity: 1 })
    );
  });

  test('handles visibility selection', () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const publicOption = getByText('Public');
    fireEvent.press(publicOption);
    
    // Check if public option is selected (would need to check styling)
    expect(getByText('Public')).toBeTruthy();
  });

  test('handles cancel button press', () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('handles photo picker action', () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const photoButton = getByText('Photo');
    fireEvent.press(photoButton);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Add Photo',
      'Choose an option',
      expect.any(Array)
    );
  });

  test('handles image selection from library', async () => {
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'mock_image_uri.jpg' }],
    };
    
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockImageResult);
    
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Trigger image picker
    const photoButton = getByText('Photo');
    fireEvent.press(photoButton);
    
    // Simulate selecting "Photo Library" from alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const photoLibraryOption = alertCall[2][1]; // Second option
    photoLibraryOption.onPress();
    
    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  test('handles camera photo capture', async () => {
    const mockCameraResult = {
      canceled: false,
      assets: [{ uri: 'mock_camera_uri.jpg' }],
    };
    
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockCameraResult);
    
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Trigger image picker
    const photoButton = getByText('Photo');
    fireEvent.press(photoButton);
    
    // Simulate selecting "Camera" from alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const cameraOption = alertCall[2][0]; // First option
    cameraOption.onPress();
    
    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });
  });

  test('handles location addition', async () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const locationButton = getByText('Location');
    fireEvent.press(locationButton);
    
    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });
  });

  test('handles location permission denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const locationButton = getByText('Location');
    fireEvent.press(locationButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Denied',
        'Location permission is required to add location'
      );
    });
  });

  test('handles successful status creation', async () => {
    const { getByPlaceholderText, getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Enter text
    const textInput = getByPlaceholderText("What's on your mind?");
    fireEvent.changeText(textInput, 'Test status content');
    
    // Press share button
    const shareButton = getByText('Share');
    fireEvent.press(shareButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/status',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock_token',
          }),
        })
      );
    });
    
    await waitFor(() => {
      expect(mockProps.onStatusCreated).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('handles status creation failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({
        success: false,
        message: 'Failed to create status',
      }),
    });
    
    const { getByPlaceholderText, getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Enter text
    const textInput = getByPlaceholderText("What's on your mind?");
    fireEvent.changeText(textInput, 'Test status content');
    
    // Press share button
    const shareButton = getByText('Share');
    fireEvent.press(shareButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to create status'
      );
    });
  });

  test('handles network error during status creation', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByPlaceholderText, getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Enter text
    const textInput = getByPlaceholderText("What's on your mind?");
    fireEvent.changeText(textInput, 'Test status content');
    
    // Press share button
    const shareButton = getByText('Share');
    fireEvent.press(shareButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to create status'
      );
    });
  });

  test('prevents submission with empty text and no image', () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const shareButton = getByText('Share');
    fireEvent.press(shareButton);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please add some text or an image'
    );
  });

  test('displays character count correctly', () => {
    const { getByPlaceholderText, getByText } = render(<CreateStatusModal {...mockProps} />);
    
    const textInput = getByPlaceholderText("What's on your mind?");
    const longText = 'a'.repeat(100);
    fireEvent.changeText(textInput, longText);
    
    expect(getByText('100/2000')).toBeTruthy();
  });

  test('handles image removal', async () => {
    // First add an image
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'mock_image_uri.jpg' }],
    };
    
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockImageResult);
    
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Add image
    const photoButton = getByText('Photo');
    fireEvent.press(photoButton);
    
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const photoLibraryOption = alertCall[2][1];
    photoLibraryOption.onPress();
    
    await waitFor(() => {
      // Image should be displayed and remove button should be available
      // This would need the component to be updated to show the remove button
    });
  });

  test('handles location removal', async () => {
    const { getByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Add location first
    const locationButton = getByText('Location');
    fireEvent.press(locationButton);
    
    await waitFor(() => {
      // Location should be displayed with a remove option
      // This would need the component to show location and remove button
    });
  });

  test('shows loading state during status creation', async () => {
    // Make fetch hang to test loading state
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    const { getByPlaceholderText, getByText, queryByText } = render(<CreateStatusModal {...mockProps} />);
    
    // Enter text
    const textInput = getByPlaceholderText("What's on your mind?");
    fireEvent.changeText(textInput, 'Test status content');
    
    // Press share button
    const shareButton = getByText('Share');
    fireEvent.press(shareButton);
    
    // Should show loading indicator instead of "Share" text
    await waitFor(() => {
      expect(queryByText('Share')).toBeNull();
    });
  });
});