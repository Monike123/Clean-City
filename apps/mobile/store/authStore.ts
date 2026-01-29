import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

// Extend UserProfile locally for state to include new fields without breaking shared contract immediately if needed,
// though we updated shared/index.ts already, so UserProfile should have them.
// However, to be safe and explicit:

interface AuthState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    hasSeenOnboarding: boolean;

    // Actions
    login: (user: UserProfile, token: string) => void;
    logout: () => void;
    setOnboardingCompleted: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            hasSeenOnboarding: false,

            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            setOnboardingCompleted: () => set({ hasSeenOnboarding: true }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
