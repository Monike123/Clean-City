import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Filter, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { WorkerTask } from '../../types';

type FilterType = 'all' | 'assigned' | 'in_progress' | 'resolved';

export default function MyTasksScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<WorkerTask[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [workerId, setWorkerId] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get worker ID first
            const { data: worker } = await supabase
                .from('workers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!worker) return;
            setWorkerId(worker.id);

            // Build query
            let query = supabase
                .from('worker_tasks')
                .select(`
                    *,
                    report:reports(id, location, waste_category, severity, description, media_file, created_at)
                `)
                .eq('worker_id', worker.id)
                .order('sla_deadline', { ascending: true });

            if (filter !== 'all') {
                query = query.eq('task_status', filter);
            }

            const { data, error } = await query;

            if (!error && data) {
                setTasks(data);
            }
        } catch (e) {
            console.error('Error fetching tasks:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, filter]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-green-500';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned' };
            case 'in_progress': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' };
            case 'resolved_pending': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pending Review' };
            case 'resolved': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' };
            case 'rejected': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
        }
    };

    const getTimeRemaining = (deadline: string) => {
        const now = new Date();
        const sla = new Date(deadline);
        const diff = sla.getTime() - now.getTime();

        if (diff < 0) return { text: 'Overdue', isOverdue: true };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours >= 24) {
            return { text: `${Math.floor(hours / 24)}d left`, isOverdue: false };
        }
        return { text: `${hours}h left`, isOverdue: hours < 4 };
    };

    const filters: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'resolved', label: 'Resolved' },
    ];

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
            <View className="px-4 py-4 border-b border-gray-100 bg-white">
                <Text className="text-2xl font-inter-bold text-text">My Tasks</Text>
                <Text className="text-textLight font-inter">{tasks.length} tasks total</Text>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="bg-white border-b border-gray-100"
                contentContainerStyle={{ padding: 12 }}
            >
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        className={`px-4 py-2 rounded-full mr-2 ${filter === f.key ? 'bg-secondary' : 'bg-gray-100'}`}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text className={filter === f.key ? 'text-white font-inter-bold' : 'text-text font-inter'}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Tasks List */}
            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                {tasks.length === 0 ? (
                    <View className="bg-white rounded-xl p-8 items-center border border-gray-100">
                        <CheckCircle2 size={48} color="#22C55E" />
                        <Text className="text-lg font-inter-bold text-text mt-4">No tasks found</Text>
                        <Text className="text-textLight font-inter text-center mt-1">
                            {filter === 'all'
                                ? 'You have no assigned tasks yet.'
                                : `No ${filter.replace('_', ' ')} tasks.`}
                        </Text>
                    </View>
                ) : (
                    tasks.map((task) => {
                        const timeRemaining = getTimeRemaining(task.sla_deadline);
                        const statusBadge = getStatusBadge(task.task_status);

                        return (
                            <TouchableOpacity
                                key={task.id}
                                className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                                onPress={() => router.push(`/worker-task/${task.id}`)}
                            >
                                {/* Priority indicator */}
                                <View className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${getPriorityColor(task.priority)}`} />

                                <View className="ml-2">
                                    {/* Header Row */}
                                    <View className="flex-row justify-between items-center mb-2">
                                        <View className={`px-2 py-1 rounded ${statusBadge.bg}`}>
                                            <Text className={`text-xs font-inter-bold ${statusBadge.text}`}>
                                                {statusBadge.label}
                                            </Text>
                                        </View>
                                        {task.task_status !== 'resolved' && (
                                            <View className={`flex-row items-center px-2 py-1 rounded ${timeRemaining.isOverdue ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                <Clock size={12} color={timeRemaining.isOverdue ? '#EF4444' : '#6B7280'} />
                                                <Text className={`text-xs ml-1 font-inter-medium ${timeRemaining.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {timeRemaining.text}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Title */}
                                    <Text className="text-base font-inter-bold text-text mb-1">
                                        {task.report?.waste_category?.replace('_', ' ') || 'Environmental Issue'}
                                    </Text>

                                    {/* Severity */}
                                    <Text className="text-sm text-textLight font-inter mb-2">
                                        Severity: {task.report?.severity || 'Unknown'}
                                    </Text>

                                    {/* Location */}
                                    <View className="flex-row items-center">
                                        <MapPin size={14} color="#9CA3AF" />
                                        <Text className="text-sm text-textLight font-inter ml-1 flex-1" numberOfLines={1}>
                                            {task.report?.location?.address || 'Location pending'}
                                        </Text>
                                    </View>

                                    {/* Points */}
                                    {task.points_awarded > 0 && (
                                        <View className="mt-2 bg-green-50 px-2 py-1 rounded self-start">
                                            <Text className="text-green-700 text-xs font-inter-bold">
                                                +{task.points_awarded} points earned
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
