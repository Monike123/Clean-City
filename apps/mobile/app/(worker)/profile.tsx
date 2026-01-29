import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    User,
    Award,
    Star,
    TrendingUp,
    Clock,
    CheckCircle2,
    Trophy,
    LogOut,
    ChevronRight,
    Settings
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { WorkerProfile } from '../../types';

export default function WorkerProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
    const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data: worker, error } = await supabase
                .from('workers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!error && worker) {
                setWorkerProfile(worker);

                // Get leaderboard position
                const { data: allWorkers } = await supabase
                    .from('workers')
                    .select('id, total_points')
                    .eq('verification_status', 'approved')
                    .order('total_points', { ascending: false });

                if (allWorkers) {
                    const position = allWorkers.findIndex(w => w.id === worker.id) + 1;
                    setLeaderboardPosition(position);
                }
            }
        } catch (e) {
            console.error('Error fetching worker profile:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleLogout = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        // Set worker as unavailable
                        if (workerProfile?.id) {
                            await supabase
                                .from('workers')
                                .update({ is_available: false })
                                .eq('id', workerProfile.id);
                        }
                        await supabase.auth.signOut();
                        logout();
                        router.replace('/(auth)/role-selector');
                    }
                }
            ]
        );
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'platinum': return '#E5E4E2';
            case 'gold': return '#FFD700';
            case 'silver': return '#C0C0C0';
            default: return '#CD7F32';
        }
    };

    const getRankIcon = (rank: string) => {
        return <Trophy size={24} color={getRankColor(rank)} />;
    };

    const getPointsToNextRank = () => {
        const points = workerProfile?.total_points || 0;
        if (points < 500) return { next: 'Silver', needed: 500 - points };
        if (points < 2000) return { next: 'Gold', needed: 2000 - points };
        if (points < 5000) return { next: 'Platinum', needed: 5000 - points };
        return { next: 'Max', needed: 0 };
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    const nextRank = getPointsToNextRank();

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                {/* Profile Header */}
                <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                    <View className="items-center">
                        <View className="bg-secondary/10 w-24 h-24 rounded-full items-center justify-center mb-4">
                            <User size={48} color="#3B82F6" />
                        </View>
                        <Text className="text-2xl font-inter-bold text-text">
                            {workerProfile?.full_name || 'Worker'}
                        </Text>
                        <Text className="text-textLight font-inter">
                            {workerProfile?.employee_id} • Ward {workerProfile?.ward_number}
                        </Text>

                        {/* Rank Badge */}
                        <View className="flex-row items-center mt-3 bg-gray-50 px-4 py-2 rounded-full">
                            {getRankIcon(workerProfile?.worker_rank || 'bronze')}
                            <Text className="ml-2 font-inter-bold text-text capitalize">
                                {workerProfile?.worker_rank || 'Bronze'} Rank
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Points & Leaderboard */}
                <View className="flex-row mb-4 space-x-3">
                    <View className="flex-1 bg-blue-500 rounded-xl p-4">
                        <Award size={24} color="#FFF" />
                        <Text className="text-3xl font-inter-bold text-white mt-2">
                            {workerProfile?.total_points || 0}
                        </Text>
                        <Text className="text-white/80 font-inter">Total Points</Text>
                    </View>
                    <View className="flex-1 bg-amber-500 rounded-xl p-4">
                        <Trophy size={24} color="#FFF" />
                        <Text className="text-3xl font-inter-bold text-white mt-2">
                            #{leaderboardPosition || '-'}
                        </Text>
                        <Text className="text-white/80 font-inter">Leaderboard</Text>
                    </View>
                </View>

                {/* Progress to Next Rank */}
                {nextRank.needed > 0 && (
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="font-inter-bold text-text">Progress to {nextRank.next}</Text>
                            <Text className="text-textLight font-inter">{nextRank.needed} pts to go</Text>
                        </View>
                        <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-secondary rounded-full"
                                style={{
                                    width: `${Math.min(100, ((workerProfile?.total_points || 0) / (workerProfile?.total_points || 0 + nextRank.needed)) * 100)}%`
                                }}
                            />
                        </View>
                    </View>
                )}

                {/* Stats */}
                <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                    <Text className="font-inter-bold text-text mb-4">Performance Stats</Text>

                    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                        <View className="flex-row items-center">
                            <CheckCircle2 size={20} color="#22C55E" />
                            <Text className="ml-3 font-inter text-text">Tasks Completed</Text>
                        </View>
                        <Text className="font-inter-bold text-text">
                            {workerProfile?.total_tasks_completed || 0}
                        </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                        <View className="flex-row items-center">
                            <Star size={20} color="#F59E0B" />
                            <Text className="ml-3 font-inter text-text">Average Rating</Text>
                        </View>
                        <Text className="font-inter-bold text-text">
                            {workerProfile?.average_rating?.toFixed(1) || '0.0'} / 5.0
                        </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                        <View className="flex-row items-center">
                            <TrendingUp size={20} color="#8B5CF6" />
                            <Text className="ml-3 font-inter text-text">SLA Compliance</Text>
                        </View>
                        <Text className="font-inter-bold text-text">
                            {workerProfile?.sla_compliance_rate?.toFixed(0) || '100'}%
                        </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-3">
                        <View className="flex-row items-center">
                            <Clock size={20} color="#3B82F6" />
                            <Text className="ml-3 font-inter text-text">Current Streak</Text>
                        </View>
                        <Text className="font-inter-bold text-text">
                            🔥 {workerProfile?.current_streak || 0} days
                        </Text>
                    </View>
                </View>

                {/* Quick Links */}
                <View className="bg-white rounded-xl mb-4 border border-gray-100 overflow-hidden">
                    <Text className="font-inter-bold text-text p-4 pb-2">Quick Links</Text>

                    <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                        onPress={() => router.push('/(worker)/leaderboard')}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-amber-100 w-10 h-10 rounded-full items-center justify-center">
                                <Trophy size={20} color="#F59E0B" />
                            </View>
                            <Text className="ml-3 font-inter-medium text-text">Leaderboard</Text>
                        </View>
                        <ChevronRight size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-4"
                        onPress={() => router.push('/(worker)/achievements')}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-purple-100 w-10 h-10 rounded-full items-center justify-center">
                                <Award size={20} color="#8B5CF6" />
                            </View>
                            <Text className="ml-3 font-inter-medium text-text">Achievements & Badges</Text>
                        </View>
                        <ChevronRight size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Account Info */}
                <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                    <Text className="font-inter-bold text-text mb-4">Account Info</Text>

                    <View className="py-2">
                        <Text className="text-textLight font-inter text-sm">Department</Text>
                        <Text className="font-inter-medium text-text capitalize">
                            {workerProfile?.department?.replace('_', ' ') || 'Not set'}
                        </Text>
                    </View>

                    <View className="py-2">
                        <Text className="text-textLight font-inter text-sm">Employment Type</Text>
                        <Text className="font-inter-medium text-text capitalize">
                            {workerProfile?.employment_type || 'Not set'}
                        </Text>
                    </View>

                    <View className="py-2">
                        <Text className="text-textLight font-inter text-sm">Phone</Text>
                        <Text className="font-inter-medium text-text">
                            {workerProfile?.phone_number || 'Not set'}
                        </Text>
                    </View>
                </View>

                {/* Sign Out */}
                <TouchableOpacity
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center justify-center"
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="#EF4444" />
                    <Text className="ml-2 font-inter-bold text-red-600">Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
