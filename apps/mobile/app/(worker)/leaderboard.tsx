import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Trophy,
    Medal,
    Crown,
    Star,
    TrendingUp,
    TrendingDown,
    Minus,
    User
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
    id: string;
    full_name: string;
    employee_id: string;
    ward_number: string;
    total_points: number;
    total_tasks_completed: number;
    worker_rank: string;
    current_streak: number;
    previous_rank?: number;
}

type TimeFrame = 'all_time' | 'monthly' | 'weekly';

export default function LeaderboardScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('all_time');
    const [myRank, setMyRank] = useState<number | null>(null);
    const [workerId, setWorkerId] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get current worker
            const { data: worker } = await supabase
                .from('workers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (worker) {
                setWorkerId(worker.id);
            }

            // Fetch leaderboard data
            const { data, error } = await supabase
                .from('workers')
                .select('id, full_name, employee_id, ward_number, total_points, total_tasks_completed, worker_rank, current_streak')
                .eq('verification_status', 'approved')
                .eq('is_active', true)
                .order('total_points', { ascending: false })
                .limit(50);

            if (!error && data) {
                setLeaderboard(data);

                // Find my rank
                if (worker) {
                    const myPosition = data.findIndex(w => w.id === worker.id);
                    setMyRank(myPosition >= 0 ? myPosition + 1 : null);
                }
            }
        } catch (e) {
            console.error('Error fetching leaderboard:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboard();
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'platinum': return '#E5E4E2';
            case 'gold': return '#FFD700';
            case 'silver': return '#C0C0C0';
            default: return '#CD7F32';
        }
    };

    const getPositionStyle = (position: number) => {
        if (position === 1) return { bg: 'bg-amber-400', text: 'text-white' };
        if (position === 2) return { bg: 'bg-gray-300', text: 'text-gray-800' };
        if (position === 3) return { bg: 'bg-amber-600', text: 'text-white' };
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    };

    const getPositionIcon = (position: number) => {
        if (position === 1) return <Crown size={20} color="#FFD700" />;
        if (position === 2) return <Medal size={20} color="#C0C0C0" />;
        if (position === 3) return <Medal size={20} color="#CD7F32" />;
        return null;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-xl font-inter-bold text-text">Leaderboard</Text>
                    <Text className="text-sm text-textLight font-inter">Top performers</Text>
                </View>
                <Trophy size={28} color="#F59E0B" />
            </View>

            {/* My Rank Card */}
            {myRank && (
                <View className="mx-4 mt-4 bg-secondary rounded-xl p-4 flex-row items-center">
                    <View className="bg-white/20 w-12 h-12 rounded-full items-center justify-center">
                        <Text className="text-white font-inter-bold text-lg">#{myRank}</Text>
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-white font-inter-bold">Your Position</Text>
                        <Text className="text-white/80 text-sm font-inter">
                            {myRank <= 10 ? 'Top 10! Keep it up! 🔥' : `${myRank > 50 ? '50+' : 50 - myRank} spots to Top 50`}
                        </Text>
                    </View>
                    <Star size={24} color="#FFF" />
                </View>
            )}

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
                <View className="mx-4 mt-4 bg-white rounded-xl p-4 border border-gray-100">
                    <Text className="font-inter-bold text-text mb-4 text-center">Top Performers</Text>
                    <View className="flex-row justify-center items-end">
                        {/* 2nd Place */}
                        <View className="items-center mx-2">
                            <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center mb-2">
                                <User size={28} color="#6B7280" />
                            </View>
                            <View className="bg-gray-300 w-14 h-16 rounded-t-lg items-center justify-center">
                                <Medal size={20} color="#FFF" />
                                <Text className="text-white font-inter-bold">2</Text>
                            </View>
                            <Text className="text-xs text-center font-inter mt-1" numberOfLines={1}>
                                {leaderboard[1]?.full_name?.split(' ')[0]}
                            </Text>
                            <Text className="text-xs text-secondary font-inter-bold">
                                {leaderboard[1]?.total_points} pts
                            </Text>
                        </View>

                        {/* 1st Place */}
                        <View className="items-center mx-2">
                            <Crown size={24} color="#FFD700" className="mb-1" />
                            <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mb-2 border-2 border-amber-400">
                                <User size={32} color="#F59E0B" />
                            </View>
                            <View className="bg-amber-400 w-16 h-20 rounded-t-lg items-center justify-center">
                                <Trophy size={24} color="#FFF" />
                                <Text className="text-white font-inter-bold">1</Text>
                            </View>
                            <Text className="text-xs text-center font-inter-bold mt-1" numberOfLines={1}>
                                {leaderboard[0]?.full_name?.split(' ')[0]}
                            </Text>
                            <Text className="text-xs text-secondary font-inter-bold">
                                {leaderboard[0]?.total_points} pts
                            </Text>
                        </View>

                        {/* 3rd Place */}
                        <View className="items-center mx-2">
                            <View className="w-14 h-14 bg-amber-100 rounded-full items-center justify-center mb-2">
                                <User size={28} color="#92400E" />
                            </View>
                            <View className="bg-amber-600 w-14 h-14 rounded-t-lg items-center justify-center">
                                <Medal size={20} color="#FFF" />
                                <Text className="text-white font-inter-bold">3</Text>
                            </View>
                            <Text className="text-xs text-center font-inter mt-1" numberOfLines={1}>
                                {leaderboard[2]?.full_name?.split(' ')[0]}
                            </Text>
                            <Text className="text-xs text-secondary font-inter-bold">
                                {leaderboard[2]?.total_points} pts
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Full Leaderboard */}
            <ScrollView
                className="mt-4"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                {leaderboard.slice(3).map((entry, index) => {
                    const position = index + 4;
                    const isMe = entry.id === workerId;

                    return (
                        <View
                            key={entry.id}
                            className={`flex-row items-center p-4 mb-2 rounded-xl border ${isMe
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-gray-100'
                                }`}
                        >
                            {/* Rank */}
                            <View className="w-10 items-center">
                                <Text className={`font-inter-bold ${isMe ? 'text-secondary' : 'text-gray-500'}`}>
                                    #{position}
                                </Text>
                            </View>

                            {/* Avatar */}
                            <View className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${isMe ? 'bg-secondary' : 'bg-gray-100'
                                }`}>
                                <User size={20} color={isMe ? '#FFF' : '#6B7280'} />
                            </View>

                            {/* Info */}
                            <View className="flex-1 ml-3">
                                <Text className={`font-inter-bold ${isMe ? 'text-secondary' : 'text-text'}`}>
                                    {entry.full_name} {isMe && '(You)'}
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className="text-xs text-textLight font-inter">
                                        Ward {entry.ward_number}
                                    </Text>
                                    <View
                                        className="w-2 h-2 rounded-full ml-2"
                                        style={{ backgroundColor: getRankColor(entry.worker_rank) }}
                                    />
                                    <Text className="text-xs text-textLight font-inter ml-1 capitalize">
                                        {entry.worker_rank}
                                    </Text>
                                </View>
                            </View>

                            {/* Points & Tasks */}
                            <View className="items-end">
                                <Text className="font-inter-bold text-secondary">
                                    {entry.total_points} pts
                                </Text>
                                <Text className="text-xs text-textLight font-inter">
                                    {entry.total_tasks_completed} tasks
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
