import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserState {
  users: any[];
  loading: boolean;
  error: string | null;
  setUsers: (users: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>()(persist(
  (set) => ({
    users: [],
    loading: false,
    error: null,
    setUsers: (users) => set({ users }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }),
  {
    name: 'user-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
));