import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

export default function SplashScreen() {
    const router = useRouter();
    const { isAuthenticated, hasSeenOnboarding, user } = useAuthStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAuthenticated && user) {
                // Route based on user role
                if (user.role === UserRole.WORKER) {
                    router.replace('/(worker)/dashboard');
                } else {
                    router.replace('/(tabs)/home');
                }
            } else if (!hasSeenOnboarding) {
                router.replace('/(auth)/onboarding');
            } else {
                // Go to role selector instead of direct login
                router.replace('/(auth)/role-selector');
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [isAuthenticated, hasSeenOnboarding, user]);

    return (
        <View className="flex-1 justify-center items-center bg-primary">
            <View className="bg-white p-4 rounded-full mb-6 shadow-lg">
                <Text className="text-4xl">🌱</Text>
            </View>
            <Text className="text-3xl font-inter-bold text-white mb-2">Clear City</Text>
            <Text className="text-white/80 font-inter text-sm mb-8">Loading your eco-journey...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
}
