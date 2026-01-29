import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Leaf, Navigation } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { ReportService } from '../../services/reportService';
import { formatDistanceToNow } from 'date-fns';

export default function HomeScreen() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ reports: 0, points: 0, trees: 0 });
    const [recentReports, setRecentReports] = useState<any[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadUserData();
        }
    }, [user?.id]);

    const loadUserData = async () => {
        if (!user) return;
        const reports = await ReportService.getUserReports(user.id);
        const resolvedCount = reports?.filter((r: any) => r.status === 'RESOLVED').length || 0;

        // Mock calculation for trees saved (e.g. 100 points = 1 tree)
        const points = user.ecoPoints || 0;
        const trees = Math.floor(points / 100);

        setStats({
            reports: reports?.length || 0,
            points: points,
            trees: trees
        });

        // Take top 3 recent
        setRecentReports(reports?.slice(0, 3) || []);
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <ScrollView className="flex-1 p-5">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-xl font-inter-bold text-text">Hello, {user?.fullName?.split(' ')[0] || 'Explorer'}!</Text>
                        <Text className="text-sm text-textLight font-inter">Ready to save the planet?</Text>
                    </View>
                    <View className="w-11 h-11 rounded-full bg-green-50 items-center justify-center">
                        <Leaf size={24} color="#2E7D32" />
                    </View>
                </View>

                {/* Impact Card */}
                <View className="bg-primary rounded-[20px] p-5 mb-6 shadow-sm">
                    <Text className="text-white text-base font-inter-bold mb-4">Your Impact</Text>
                    <View className="flex-row justify-between items-center">
                        <View className="items-center flex-1">
                            <Text className="text-white text-2xl font-inter-bold">{stats.reports}</Text>
                            <Text className="text-white text-xs opacity-90 font-inter">Reports</Text>
                        </View>
                        <View className="w-[1px] h-8 bg-white opacity-30" />
                        <View className="items-center flex-1">
                            <Text className="text-white text-2xl font-inter-bold">{stats.points}</Text>
                            <Text className="text-white text-xs opacity-90 font-inter">Eco-Points</Text>
                        </View>
                        <View className="w-[1px] h-8 bg-white opacity-30" />
                        <View className="items-center flex-1">
                            <Text className="text-white text-2xl font-inter-bold">{stats.trees}</Text>
                            <Text className="text-white text-xs opacity-90 font-inter">Trees Saved</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-inter-bold text-text">Recent Activity</Text>
                </View>

                {recentReports.length === 0 ? (
                    <View className="bg-card p-6 rounded-2xl items-center justify-center">
                        <Text className="text-textLight font-inter">No recent activity</Text>
                    </View>
                ) : (
                    recentReports.map((report) => {
                        // Safe parser for location
                        let lat = 0, lng = 0;
                        if (report.location) {
                            // If it's already an object (JSONB)
                            if (typeof report.location === 'object') {
                                lat = report.location.latitude;
                                lng = report.location.longitude;
                            }
                            // If it came back as string for some reason
                            else if (typeof report.location === 'string') {
                                try {
                                    const parsed = JSON.parse(report.location);
                                    lat = parsed.latitude;
                                    lng = parsed.longitude;
                                } catch (e) { }
                            }
                        }

                        return (
                            <View key={report.id} className="flex-row items-center bg-card p-4 rounded-2xl mb-3 shadow-sm">
                                <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-4">
                                    <Navigation size={20} color="#1565C0" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-inter-bold text-text capitalize">{report.waste_category || 'Waste'}</Text>
                                    <Text className="text-xs text-textLight mt-0.5">
                                        {lat?.toFixed(2)}, {lng?.toFixed(2)} • {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                    </Text>
                                </View>
                                <View className={`px-2.5 py-1 rounded-xl ${report.status === 'resolved' ? 'bg-green-50' :
                                        report.status === 'submitted' ? 'bg-orange-50' : 'bg-red-50'
                                    }`}>
                                    <Text className={`text-[10px] font-inter-bold ${report.status === 'resolved' ? 'text-success' :
                                            report.status === 'submitted' ? 'text-accent' : 'text-danger'
                                        }`}>
                                        {report.status}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
