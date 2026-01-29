import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Filter, MapPin, Calendar, Clock } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { ReportService } from '../services/reportService';
import { format } from 'date-fns';

// Create a component for the Report Item
const ReportItem = ({ item }: { item: any }) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() => router.push(`/report/${item.id}`)}
            className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100 flex-row"
        >
            <Image
                source={{ uri: item.image_url }}
                className="w-20 h-20 rounded-lg bg-gray-200"
            />
            <View className="flex-1 ml-4 justify-between">
                <View>
                    <div className="flex-row justify-between items-start">
                        <Text className="font-bold text-base text-text capitalize" numberOfLines={1}>{item.waste_category}</Text>
                        <View className={`px-2 py-1 rounded-full ${item.status === 'resolved' ? 'bg-green-100' :
                                item.status === 'verified' ? 'bg-blue-100' : 'bg-yellow-100'
                            }`}>
                            <Text className={`text-xs font-bold capitalize ${item.status === 'resolved' ? 'text-green-700' :
                                    item.status === 'verified' ? 'text-blue-700' : 'text-yellow-700'
                                }`}>{item.status}</Text>
                        </View>
                    </div>
                    <View className="flex-row items-center mt-1">
                        <MapPin size={12} color="#9CA3AF" />
                        <Text className="text-xs text-textLight ml-1 flex-1" numberOfLines={1}>
                            {item.location?.address || 'Unknown Location'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                        <Calendar size={12} color="#9CA3AF" />
                        <Text className="text-xs text-textLight ml-1">
                            {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : 'Just now'}
                        </Text>
                    </View>
                    <Text className={`text-xs font-bold ${item.severity === 'critical' || item.severity === 'high' ? 'text-danger' : 'text-textLight'
                        }`}>
                        {item.severity ? item.severity.toUpperCase() : 'MEDIUM'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // useFocusEffect to refresh when coming back
    useFocusEffect(
        useCallback(() => {
            fetchReports();
        }, [])
    );

    const fetchReports = async () => {
        // If no user, mock some data or show empty
        const userId = user?.id || 'anon_user';
        const data = await ReportService.getUserReports(userId);
        setReports(data || []);
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold font-inter-bold text-text">My Reports</Text>
                </View>
                <TouchableOpacity>
                    <Filter size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1 px-5 pt-4">
                {loading ? (
                    <ActivityIndicator size="large" color="#2E7D32" className="mt-10" />
                ) : reports.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-lg font-inter text-textLight">No reports yet.</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/report')}
                            className="mt-4 bg-primary px-6 py-3 rounded-full"
                        >
                            <Text className="text-white font-bold">Start Reporting</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={reports}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <ReportItem item={item} />}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
                        }
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
