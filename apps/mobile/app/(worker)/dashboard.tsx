import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Award,
    ChevronRight,
    MapPin
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { WorkerProfile, WorkerTask } from '../../types';

export default function WorkerDashboardScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
    const [tasks, setTasks] = useState<WorkerTask[]>([]);
    const [stats, setStats] = useState({
        assigned: 0,
        inProgress: 0,
        completed: 0,
        slaCompliance: 0
    });

    const fetchWorkerData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch worker profile
            const { data: worker, error: workerError } = await supabase
                .from('workers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (workerError) throw workerError;
            setWorkerProfile(worker);

            // Fetch tasks with report data
            const { data: tasksData, error: tasksError } = await supabase
                .from('worker_tasks')
                .select(`
                    *,
                    report:reports(id, location, waste_category, severity, description, media_file, created_at)
                `)
                .eq('worker_id', worker.id)
                .in('task_status', ['assigned', 'in_progress'])
                .order('sla_deadline', { ascending: true })
                .limit(5);

            if (!tasksError && tasksData) {
                setTasks(tasksData);
            }

            // Calculate stats
            const { data: allTasks } = await supabase
                .from('worker_tasks')
                .select('task_status, sla_breached')
                .eq('worker_id', worker.id);

            if (allTasks) {
                const assigned = allTasks.filter(t => t.task_status === 'assigned').length;
                const inProgress = allTasks.filter(t => t.task_status === 'in_progress').length;
                const completed = allTasks.filter(t => t.task_status === 'resolved').length;
                const slaMet = allTasks.filter(t => t.task_status === 'resolved' && !t.sla_breached).length;
                const slaCompliance = completed > 0 ? Math.round((slaMet / completed) * 100) : 100;

                setStats({ assigned, inProgress, completed, slaCompliance });
            }
        } catch (e) {
            console.error('Error fetching worker data:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchWorkerData();
        }, [fetchWorkerData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkerData();
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'platinum': return '#E5E4E2';
            case 'gold': return '#FFD700';
            case 'silver': return '#C0C0C0';
            default: return '#CD7F32';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-green-100 text-green-700';
        }
    };

    const getTimeRemaining = (deadline: string) => {
        const now = new Date();
        const sla = new Date(deadline);
        const diff = sla.getTime() - now.getTime();

        if (diff < 0) return { text: 'Overdue', isOverdue: true };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return { text: `${days}d ${hours % 24}h left`, isOverdue: false };
        }
        return { text: `${hours}h ${minutes}m left`, isOverdue: hours < 4 };
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
            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-2xl font-inter-bold text-text">
                            Hello, {workerProfile?.full_name?.split(' ')[0] || 'Worker'}!
                        </Text>
                        <Text className="text-textLight font-inter">
                            Ward {workerProfile?.ward_number} • {workerProfile?.department?.replace('_', ' ')}
                        </Text>
                    </View>
                    <View className="flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-200">
                        <Award size={18} color={getRankColor(workerProfile?.worker_rank || 'bronze')} />
                        <Text className="ml-2 font-inter-bold text-text capitalize">
                            {workerProfile?.worker_rank || 'Bronze'}
                        </Text>
                    </View>
                </View>

                {/* Stats Cards */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-[48%] mb-3">
                        <ClipboardList size={24} color="#3B82F6" />
                        <Text className="text-2xl font-inter-bold text-blue-700 mt-2">{stats.assigned}</Text>
                        <Text className="text-blue-600 font-inter text-sm">Assigned</Text>
                    </View>
                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-[48%] mb-3">
                        <Clock size={24} color="#F59E0B" />
                        <Text className="text-2xl font-inter-bold text-amber-700 mt-2">{stats.inProgress}</Text>
                        <Text className="text-amber-600 font-inter text-sm">In Progress</Text>
                    </View>
                    <View className="bg-green-50 border border-green-200 rounded-xl p-4 w-[48%]">
                        <CheckCircle2 size={24} color="#22C55E" />
                        <Text className="text-2xl font-inter-bold text-green-700 mt-2">{stats.completed}</Text>
                        <Text className="text-green-600 font-inter text-sm">Completed</Text>
                    </View>
                    <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 w-[48%]">
                        <TrendingUp size={24} color="#8B5CF6" />
                        <Text className="text-2xl font-inter-bold text-purple-700 mt-2">{stats.slaCompliance}%</Text>
                        <Text className="text-purple-600 font-inter text-sm">SLA Compliance</Text>
                    </View>
                </View>

                {/* Points & Streak */}
                <View className="bg-gradient-to-r from-blue-500 to-blue-600 bg-blue-500 rounded-2xl p-5 mb-6">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-white/80 font-inter text-sm">Total Points</Text>
                            <Text className="text-3xl font-inter-bold text-white">
                                {workerProfile?.total_points || 0}
                            </Text>
                        </View>
                        <View className="bg-white/20 px-4 py-2 rounded-full">
                            <Text className="text-white font-inter-bold">
                                🔥 {workerProfile?.current_streak || 0} day streak
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Urgent Tasks */}
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-inter-bold text-text">Priority Tasks</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(worker)/tasks')}
                            className="flex-row items-center"
                        >
                            <Text className="text-secondary font-inter-medium">View All</Text>
                            <ChevronRight size={18} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>

                    {tasks.length === 0 ? (
                        <View className="bg-white rounded-xl p-6 items-center border border-gray-100">
                            <CheckCircle2 size={48} color="#22C55E" />
                            <Text className="text-lg font-inter-bold text-text mt-3">All caught up!</Text>
                            <Text className="text-textLight font-inter text-center mt-1">
                                No pending tasks. Check explore for bonus tasks.
                            </Text>
                        </View>
                    ) : (
                        tasks.map((task) => {
                            const timeRemaining = getTimeRemaining(task.sla_deadline);
                            return (
                                <TouchableOpacity
                                    key={task.id}
                                    className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                                    onPress={() => router.push(`/worker-task/${task.id}`)}
                                >
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                                            <Text className="text-xs font-inter-bold uppercase">{task.priority}</Text>
                                        </View>
                                        <View className={`flex-row items-center ${timeRemaining.isOverdue ? 'bg-red-100' : 'bg-gray-100'} px-2 py-1 rounded`}>
                                            <Clock size={12} color={timeRemaining.isOverdue ? '#EF4444' : '#6B7280'} />
                                            <Text className={`text-xs ml-1 font-inter-medium ${timeRemaining.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                                {timeRemaining.text}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-base font-inter-bold text-text mb-1">
                                        {task.report?.waste_category?.replace('_', ' ') || 'Environmental Issue'}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <MapPin size={14} color="#9CA3AF" />
                                        <Text className="text-sm text-textLight font-inter ml-1 flex-1" numberOfLines={1}>
                                            {task.report?.location?.address || 'Location pending'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Quick Actions */}
                <View className="mb-24">
                    <Text className="text-lg font-inter-bold text-text mb-3">Quick Actions</Text>
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            className="flex-1 bg-secondary py-4 rounded-xl items-center"
                            onPress={() => router.push('/(worker)/explore-tasks')}
                        >
                            <Text className="text-white font-inter-bold">Find Bonus Tasks</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row space-x-3 mt-3">
                        <TouchableOpacity
                            className="flex-1 bg-amber-500 py-4 rounded-xl items-center flex-row justify-center"
                            onPress={() => router.push('/(worker)/achievements')}
                        >
                            <Award size={18} color="#FFF" />
                            <Text className="text-white font-inter-bold ml-2">Achievements</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-purple-500 py-4 rounded-xl items-center flex-row justify-center"
                            onPress={() => router.push('/(worker)/leaderboard')}
                        >
                            <TrendingUp size={18} color="#FFF" />
                            <Text className="text-white font-inter-bold ml-2">Leaderboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
