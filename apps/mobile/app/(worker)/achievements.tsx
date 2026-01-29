import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Trophy,
    Star,
    Award,
    Medal,
    Crown,
    Flame,
    Zap,
    Sparkles,
    Target,
    CheckCircle,
    Gem,
    Rocket,
    Hammer,
    Footprints,
    Sun,
    Moon,
    Gauge,
    Lock
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface Badge {
    id: string;
    badge_code: string;
    badge_name: string;
    badge_description: string;
    badge_icon: string;
    badge_color: string;
    badge_category: string;
    points_required: number;
    tasks_required: number;
    streak_required: number;
}

interface EarnedBadge {
    id: string;
    badge_id: string;
    earned_at: string;
    badge: Badge;
}

// Icon mapping
const iconMap: { [key: string]: any } = {
    Trophy,
    Star,
    Award,
    Medal,
    Crown,
    Flame,
    Zap,
    Sparkles,
    Target,
    CheckCircle,
    Gem,
    Rocket,
    Hammer,
    Footprints,
    Sun,
    Moon,
    Gauge
};

export default function AchievementsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [workerStats, setWorkerStats] = useState<any>(null);

    const fetchBadges = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get worker ID and stats
            const { data: worker } = await supabase
                .from('workers')
                .select('id, total_points, total_tasks_completed, current_streak')
                .eq('user_id', user.id)
                .single();

            if (worker) {
                setWorkerStats(worker);

                // Get all badges
                const { data: badges } = await supabase
                    .from('worker_badges')
                    .select('*')
                    .eq('is_active', true)
                    .order('badge_category', { ascending: true });

                if (badges) {
                    setAllBadges(badges);
                }

                // Get earned badges
                const { data: earned } = await supabase
                    .from('worker_earned_badges')
                    .select('badge_id')
                    .eq('worker_id', worker.id);

                if (earned) {
                    setEarnedBadges(earned.map(e => e.badge_id));
                }
            }
        } catch (e) {
            console.error('Error fetching badges:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBadges();
    };

    const categories = [
        { key: 'all', label: 'All' },
        { key: 'milestone', label: 'Milestones' },
        { key: 'points', label: 'Points' },
        { key: 'streak', label: 'Streaks' },
        { key: 'quality', label: 'Quality' },
        { key: 'special', label: 'Special' }
    ];

    const filteredBadges = selectedCategory === 'all'
        ? allBadges
        : allBadges.filter(b => b.badge_category === selectedCategory);

    const earnedCount = earnedBadges.length;
    const totalCount = allBadges.length;
    const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

    const getProgress = (badge: Badge) => {
        if (!workerStats) return { current: 0, target: 0, percent: 0 };

        if (badge.tasks_required > 0) {
            const current = workerStats.total_tasks_completed;
            return {
                current,
                target: badge.tasks_required,
                percent: Math.min(100, (current / badge.tasks_required) * 100)
            };
        }
        if (badge.points_required > 0) {
            const current = workerStats.total_points;
            return {
                current,
                target: badge.points_required,
                percent: Math.min(100, (current / badge.points_required) * 100)
            };
        }
        if (badge.streak_required > 0) {
            const current = workerStats.current_streak;
            return {
                current,
                target: badge.streak_required,
                percent: Math.min(100, (current / badge.streak_required) * 100)
            };
        }
        return { current: 0, target: 0, percent: 0 };
    };

    const renderBadgeIcon = (iconName: string, color: string, size: number = 32, locked: boolean = false) => {
        const IconComponent = iconMap[iconName] || Trophy;
        return <IconComponent size={size} color={locked ? '#9CA3AF' : color} />;
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
                    <Text className="text-xl font-inter-bold text-text">Achievements</Text>
                    <Text className="text-sm text-textLight font-inter">
                        {earnedCount} of {totalCount} badges earned
                    </Text>
                </View>
            </View>

            {/* Progress Overview */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="font-inter-bold text-text">Collection Progress</Text>
                    <Text className="font-inter-bold text-secondary">{progressPercent}%</Text>
                </View>
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <View
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 bg-amber-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </View>
                <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-textLight font-inter">{earnedCount} earned</Text>
                    <Text className="text-xs text-textLight font-inter">{totalCount - earnedCount} remaining</Text>
                </View>
            </View>

            {/* Category Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="my-4"
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === cat.key ? 'bg-secondary' : 'bg-gray-100'}`}
                        onPress={() => setSelectedCategory(cat.key)}
                    >
                        <Text className={selectedCategory === cat.key ? 'text-white font-inter-bold' : 'text-text font-inter'}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Badges Grid */}
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                <View className="flex-row flex-wrap justify-between">
                    {filteredBadges.map((badge) => {
                        const isEarned = earnedBadges.includes(badge.id);
                        const progress = getProgress(badge);

                        return (
                            <View
                                key={badge.id}
                                className={`w-[48%] mb-4 rounded-xl p-4 border ${isEarned
                                        ? 'bg-white border-amber-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {/* Badge Icon */}
                                <View className={`items-center justify-center mb-3 ${isEarned ? '' : 'opacity-40'}`}>
                                    <View className={`w-16 h-16 rounded-full items-center justify-center ${isEarned ? 'bg-amber-50' : 'bg-gray-100'
                                        }`}>
                                        {renderBadgeIcon(badge.badge_icon, badge.badge_color, 32, !isEarned)}
                                    </View>
                                    {!isEarned && (
                                        <View className="absolute">
                                            <Lock size={16} color="#9CA3AF" />
                                        </View>
                                    )}
                                </View>

                                {/* Badge Info */}
                                <Text className={`text-center font-inter-bold text-sm ${isEarned ? 'text-text' : 'text-gray-400'}`}>
                                    {badge.badge_name}
                                </Text>
                                <Text className={`text-center text-xs mt-1 ${isEarned ? 'text-textLight' : 'text-gray-400'}`} numberOfLines={2}>
                                    {badge.badge_description}
                                </Text>

                                {/* Progress Bar (if not earned and has trackable goal) */}
                                {!isEarned && progress.target > 0 && (
                                    <View className="mt-3">
                                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <View
                                                className="h-full bg-secondary rounded-full"
                                                style={{ width: `${progress.percent}%` }}
                                            />
                                        </View>
                                        <Text className="text-xs text-gray-400 text-center mt-1 font-inter">
                                            {progress.current} / {progress.target}
                                        </Text>
                                    </View>
                                )}

                                {/* Earned Indicator */}
                                {isEarned && (
                                    <View className="mt-2 bg-green-50 py-1 rounded items-center">
                                        <Text className="text-green-600 text-xs font-inter-bold">✓ Earned</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
