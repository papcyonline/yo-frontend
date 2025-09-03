import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MatchState {
  matches: any[];
  loading: boolean;
  error: string | null;
  setMatches: (matches: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMatchStore = create<MatchState>()(persist(
  (set) => ({
    matches: [],
    loading: false,
    error: null,
    setMatches: (matches) => set({ matches }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }),
  {
    name: 'match-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
));