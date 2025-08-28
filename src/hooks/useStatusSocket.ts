import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StatusSocketEvents {
  onNewStatus?: (status: any) => void;
  onStatusLiked?: (data: { statusId: string; likedBy: string; likeCount: number }) => void;
  onStatusCommented?: (data: { statusId: string; comment: any; commentCount: number }) => void;
  onStatusDeleted?: (data: { statusId: string; userId: string }) => void;
  onStatusViewed?: (data: { statusId: string; viewerId: string }) => void;
  onStatusInteraction?: (data: { statusId: string; type: string; userId: string; data: any }) => void;
}

export const useStatusSocket = (events: StatusSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const isConnected = useRef<boolean>(false);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        
        if (!token) {
          console.warn('No auth token found for socket connection');
          return;
        }

        // Initialize socket connection
        const socket = io('http://localhost:9002', {
          auth: {
            token: token
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          console.log('📡 Status socket connected');
          isConnected.current = true;
          
          // Join status feed room for real-time updates
          socket.emit('join_status_feed');
        });

        socket.on('disconnect', () => {
          console.log('📡 Status socket disconnected');
          isConnected.current = false;
        });

        socket.on('connect_error', (error) => {
          console.error('📡 Status socket connection error:', error);
          isConnected.current = false;
        });

        // Status-related events
        if (events.onNewStatus) {
          socket.on('new_status', events.onNewStatus);
        }

        if (events.onStatusLiked) {
          socket.on('status_liked', events.onStatusLiked);
        }

        if (events.onStatusCommented) {
          socket.on('status_commented', events.onStatusCommented);
        }

        if (events.onStatusDeleted) {
          socket.on('status_deleted', events.onStatusDeleted);
        }

        if (events.onStatusViewed) {
          socket.on('status_viewed', events.onStatusViewed);
        }

        if (events.onStatusInteraction) {
          socket.on('status_interaction', events.onStatusInteraction);
        }

      } catch (error) {
        console.error('Error connecting status socket:', error);
      }
    };

    connectSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('📡 Cleaning up status socket');
        socketRef.current.emit('leave_status_feed');
        socketRef.current.disconnect();
        socketRef.current = null;
        isConnected.current = false;
      }
    };
  }, []);

  // Socket utility functions
  const emitStatusView = (statusId: string, statusOwnerId: string) => {
    if (socketRef.current && isConnected.current) {
      socketRef.current.emit('status_view', {
        statusId,
        statusOwnerId
      });
    }
  };

  const emitStatusInteraction = (
    statusId: string, 
    statusOwnerId: string, 
    type: 'like' | 'comment' | 'share',
    data?: any
  ) => {
    if (socketRef.current && isConnected.current) {
      socketRef.current.emit('status_interaction', {
        statusId,
        statusOwnerId,
        type,
        data
      });
    }
  };

  const joinStatusFeed = () => {
    if (socketRef.current && isConnected.current) {
      socketRef.current.emit('join_status_feed');
    }
  };

  const leaveStatusFeed = () => {
    if (socketRef.current && isConnected.current) {
      socketRef.current.emit('leave_status_feed');
    }
  };

  return {
    socket: socketRef.current,
    isConnected: isConnected.current,
    emitStatusView,
    emitStatusInteraction,
    joinStatusFeed,
    leaveStatusFeed
  };
};

export default useStatusSocket;