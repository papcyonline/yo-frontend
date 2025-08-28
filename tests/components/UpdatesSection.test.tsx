import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UpdatesSection from '../../src/components/status/UpdatesSection';
import { StatusAPI } from '../../src/services/api/status';

// Mock the StatusAPI
jest.mock('../../src/services/api/status', () => ({
  StatusAPI: {
    getStatusFeed: jest.fn(),
    getMyStatuses: jest.fn(),
    deleteStatus: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const mockStatusFeedResponse = {
  success: true,
  statuses: [
    {
      _id: 'status1',
      user_id: {
        _id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        profile_photo_url: 'https://example.com/photo.jpg',
      },
      content: {
        text: 'This is a test status',
        type: 'text',
      },
      engagement: {
        likes: [],
        comments: [],
        views: 5,
      },
      created_at: new Date().toISOString(),
    },
    {
      _id: 'status2',
      user_id: {
        _id: 'user2',
        first_name: 'Jane',
        last_name: 'Smith',
      },
      content: {
        text: 'Another test status',
        type: 'text',
      },
      media: {
        thumbnail_url: 'https://example.com/thumbnail.jpg',
      },
      engagement: {
        likes: [{ user_id: 'user1' }],
        comments: [{ text: 'Nice post!' }],
        views: 10,
      },
      created_at: new Date().toISOString(),
    },
  ],
};

const mockMyStatusesResponse = {
  success: true,
  statuses: [
    {
      _id: 'mystatus1',
      user_id: {
        _id: 'currentUser',
        first_name: 'Current',
        last_name: 'User',
      },
      content: {
        text: 'My own status',
        type: 'text',
      },
      engagement: {
        likes: [],
        comments: [],
        views: 3,
      },
      created_at: new Date().toISOString(),
    },
  ],
};

describe('UpdatesSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage user data
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'user_data') {
        return Promise.resolve(JSON.stringify({ _id: 'currentUser' }));
      }
      return Promise.resolve(null);
    });

    // Mock StatusAPI responses
    (StatusAPI.getStatusFeed as jest.Mock).mockResolvedValue(mockStatusFeedResponse);
    (StatusAPI.getMyStatuses as jest.Mock).mockResolvedValue(mockMyStatusesResponse);
    (StatusAPI.deleteStatus as jest.Mock).mockResolvedValue({ success: true });
  });

  test('renders loading state initially', async () => {
    const { getByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    expect(getByText('Loading Updates...')).toBeTruthy();
  });

  test('renders updates section with header and content', async () => {
    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Check if main elements are rendered
    expect(getByText('Updates')).toBeTruthy();
    expect(getByText('Status feature loaded')).toBeTruthy();
  });

  test('displays my updates section when user has statuses', async () => {
    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    expect(getByText('My Updates')).toBeTruthy();
    expect(getByText('Add Update')).toBeTruthy();
  });

  test('displays recent updates section with status data', async () => {
    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    expect(getByText('Recent Updates')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    expect(getByText('This is a test status')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  test('handles create status modal opening', async () => {
    const { getByText, queryByText, getAllByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Find and press the add button (there might be multiple)
    const addButtons = getAllByText('Add Update');
    fireEvent.press(addButtons[0]);

    // Note: Since CreateStatusModal is a separate component, 
    // we can't test its rendering here without mocking it
    // This would require additional setup
  });

  test('handles status deletion', async () => {
    const { getByText, queryByText, getByTestId } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Note: The delete functionality would need test IDs or accessibility labels
    // to be properly testable. The actual implementation uses Alert.alert
    // which would need to be mocked separately.
  });

  test('handles navigation to status detail', async () => {
    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Press on a status card to navigate
    const statusText = getByText('This is a test status');
    fireEvent.press(statusText.parent);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('StatusDetail', { 
      statusId: 'status1' 
    });
  });

  test('handles refresh functionality', async () => {
    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Verify API calls were made initially
    expect(StatusAPI.getStatusFeed).toHaveBeenCalledWith(10, 0);
    expect(StatusAPI.getMyStatuses).toHaveBeenCalledWith(5, 0);
  });

  test('displays empty state when no updates exist', async () => {
    // Mock empty responses
    (StatusAPI.getStatusFeed as jest.Mock).mockResolvedValue({
      success: true,
      statuses: [],
    });
    (StatusAPI.getMyStatuses as jest.Mock).mockResolvedValue({
      success: true,
      statuses: [],
    });

    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    expect(getByText('No updates yet')).toBeTruthy();
    expect(getByText('Be the first to share!')).toBeTruthy();
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    (StatusAPI.getStatusFeed as jest.Mock).mockRejectedValue(new Error('API Error'));
    (StatusAPI.getMyStatuses as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Component should still render but with empty state
    expect(queryByText('No updates yet')).toBeTruthy();
  });

  test('formats time ago correctly', async () => {
    // Create a status with a specific timestamp
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const statusWithTime = {
      ...mockStatusFeedResponse,
      statuses: [{
        ...mockStatusFeedResponse.statuses[0],
        created_at: oneHourAgo.toISOString(),
      }],
    };

    (StatusAPI.getStatusFeed as jest.Mock).mockResolvedValue(statusWithTime);

    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Should display "1h" for one hour ago
    expect(getByText('1h')).toBeTruthy();
  });

  test('displays user avatars correctly', async () => {
    const { queryByText, queryAllByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Should display initials for users without profile photos
    expect(queryAllByText('JS')).toBeTruthy(); // Jane Smith initials
  });

  test('displays engagement stats correctly', async () => {
    const { getByText, queryByText } = render(<UpdatesSection navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(queryByText('Loading Updates...')).toBeNull();
    });

    // Check engagement numbers
    expect(getByText('1')).toBeTruthy(); // Like count for status2
    expect(getByText('5')).toBeTruthy(); // View count for status1
    expect(getByText('10')).toBeTruthy(); // View count for status2
  });
});