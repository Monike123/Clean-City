import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function SplashScreen() {
    const router = useRouter();
    const { isAuthenticated, hasSeenOnboarding } = useAuthStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAuthenticated) {
                router.replace('/(tabs)/home');
            } else if (!hasSeenOnboarding) {
                // Determine if we show onboarding or login directly
                router.replace('/(auth)/onboarding');
            } else {
                router.replace('/(auth)/login');
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [isAuthenticated, hasSeenOnboarding]);

    return (
        <View className="flex-1 justify-center items-center bg-primary">
            <View className="bg-white p-4 rounded-full mb-6 shadow-lg">
                {/* Using a Text placeholder for Leaf if lucide isn't imported, or Import if needed. 
                   Since we can't easily add import here without checking lines 1-5, we use a simple text icon or rely on existing imports if any.
                   Actually, let's just use text for the logo to be safe and simple as requested. */}
                <Text className="text-4xl">🌱</Text>
            </View>
            <Text className="text-3xl font-inter-bold text-white mb-2">EnvironmentTech</Text>
            <Text className="text-white/80 font-inter text-sm mb-8">Loading your eco-journey...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
}
