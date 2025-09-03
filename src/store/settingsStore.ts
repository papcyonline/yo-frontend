import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  setNotifications: (notifications: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(persist(
  (set) => ({
    theme: 'dark',
    language: 'en',
    notifications: true,
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
    setNotifications: (notifications) => set({ notifications }),
  }),
  {
    name: 'settings-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
));