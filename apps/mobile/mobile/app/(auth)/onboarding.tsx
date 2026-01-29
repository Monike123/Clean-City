import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function OnboardingScreen() {
    const router = useRouter();
    const { setOnboardingCompleted } = useAuthStore();

    const handleFinish = () => {
        setOnboardingCompleted();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 justify-center px-8 items-center">
                <View className="bg-green-100 p-6 rounded-full mb-8">
                    <Text className="text-6xl">🌍</Text>
                </View>

                <Text className="text-3xl font-inter-bold text-primary text-center mb-4">
                    EnvironmentTech
                </Text>

                <Text className="text-lg text-textLight font-inter text-center leading-relaxed">
                    Snap a photo, tag the location, and report waste in your neighborhood instantly.
                </Text>

                <Text className="text-sm text-gray-400 font-inter text-center mt-6">
                    Join the community of {new Date().getFullYear()} eco-warriors.
                </Text>
            </View>

            <View className="p-8">
                <TouchableOpacity
                    className="bg-primary w-full py-4 rounded-xl items-center shadow-lg active:opacity-90"
                    onPress={handleFinish}
                >
                    <Text className="text-white text-lg font-inter-bold">Get Started</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
