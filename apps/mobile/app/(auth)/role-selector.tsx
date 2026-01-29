import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Briefcase } from 'lucide-react-native';

export default function RoleSelectorScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="flex-1 justify-center px-8">
                {/* Logo / Title */}
                <View className="items-center mb-12">
                    <Text className="text-4xl font-inter-bold text-primary mb-2">Clear City</Text>
                    <Text className="text-base text-textLight font-inter text-center">
                        Choose how you'd like to sign in
                    </Text>
                </View>

                {/* Role Selection Cards */}
                <View className="space-y-4">
                    {/* Citizen Login */}
                    <TouchableOpacity
                        className="bg-white border-2 border-primary rounded-2xl p-6 flex-row items-center shadow-sm"
                        onPress={() => router.push('/(auth)/login')}
                        activeOpacity={0.7}
                    >
                        <View className="bg-primary/10 p-4 rounded-xl mr-4">
                            <Users size={32} color="#22C55E" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-inter-bold text-text mb-1">Citizen</Text>
                            <Text className="text-sm text-textLight font-inter">
                                Report environmental issues and track their resolution
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Worker Login */}
                    <TouchableOpacity
                        className="bg-white border-2 border-secondary rounded-2xl p-6 flex-row items-center shadow-sm"
                        onPress={() => router.push('/(auth)/worker-login')}
                        activeOpacity={0.7}
                    >
                        <View className="bg-secondary/10 p-4 rounded-xl mr-4">
                            <Briefcase size={32} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-inter-bold text-text mb-1">Worker</Text>
                            <Text className="text-sm text-textLight font-inter">
                                Field staff assigned to resolve reported issues
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Info Text */}
                <View className="mt-12">
                    <Text className="text-center text-textLight text-sm font-inter">
                        Workers must be verified by an authority before accessing the system
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
