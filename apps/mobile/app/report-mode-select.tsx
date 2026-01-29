import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, FileText, Camera, Video, Zap } from 'lucide-react-native';

export default function ReportModeSelectScreen() {
    const router = useRouter();

    const handleAIMode = () => {
        router.push({
            pathname: '/(tabs)/report',
            params: { mode: 'ai' }
        });
    };

    const handleManualMode = () => {
        router.push({
            pathname: '/(tabs)/report',
            params: { mode: 'manual' }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-1 justify-center">
                {/* Header */}
                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4">
                        <Camera size={40} color="#2E7D32" />
                    </View>
                    <Text className="text-2xl font-inter-bold text-text text-center mb-2">
                        Choose Report Mode
                    </Text>
                    <Text className="text-sm text-textLight font-inter text-center px-4">
                        Select how you'd like to report this waste incident
                    </Text>
                </View>

                {/* AI Mode Card */}
                <TouchableOpacity
                    onPress={handleAIMode}
                    className="bg-white rounded-3xl p-6 mb-4 shadow-lg border-2 border-primary/20"
                    activeOpacity={0.8}
                >
                    <View className="flex-row items-center mb-3">
                        <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                            <Sparkles size={24} color="#7C3AED" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-inter-bold text-text">AI Mode</Text>
                            <View className="flex-row items-center mt-1">
                                <Zap size={12} color="#FF9800" />
                                <Text className="text-xs text-accent font-inter-bold ml-1">Quick & Smart</Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-sm text-textLight font-inter mb-4">
                        Just snap a photo and let AI analyze everything for you. Fast and intelligent.
                    </Text>

                    <View className="bg-gray-50 rounded-xl p-3">
                        <View className="flex-row items-center mb-2">
                            <Camera size={14} color="#2E7D32" />
                            <Text className="text-xs text-text font-inter ml-2">Photo only</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Sparkles size={14} color="#2E7D32" />
                            <Text className="text-xs text-text font-inter ml-2">AI auto-fills details</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Manual Mode Card */}
                <TouchableOpacity
                    onPress={handleManualMode}
                    className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200"
                    activeOpacity={0.8}
                >
                    <View className="flex-row items-center mb-3">
                        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                            <FileText size={24} color="#2196F3" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-inter-bold text-text">Manual Mode</Text>
                            <Text className="text-xs text-blue-600 font-inter-bold mt-1">Detailed Report</Text>
                        </View>
                    </View>

                    <Text className="text-sm text-textLight font-inter mb-4">
                        Provide comprehensive details with photos and videos. Perfect for complex incidents.
                    </Text>

                    <View className="bg-gray-50 rounded-xl p-3">
                        <View className="flex-row items-center mb-2">
                            <Camera size={14} color="#2196F3" />
                            <Text className="text-xs text-text font-inter ml-2">Photo + Video support</Text>
                        </View>
                        <View className="flex-row items-center">
                            <FileText size={14} color="#2196F3" />
                            <Text className="text-xs text-text font-inter ml-2">Manual form fields</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Info Note */}
                <View className="mt-6 bg-blue-50 p-4 rounded-2xl">
                    <Text className="text-xs text-blue-700 font-inter text-center">
                        💡 Tip: Use AI mode for quick reporting, Manual mode for detailed documentation
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
