import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CommunityState {
  communities: any[];
  loading: boolean;
  error: string | null;
  setCommunities: (communities: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCommunityStore = create<CommunityState>()(persist(
  (set) => ({
    communities: [],
    loading: false,
    error: null,
    setCommunities: (communities) => set({ communities }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }),
  {
    name: 'community-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
));