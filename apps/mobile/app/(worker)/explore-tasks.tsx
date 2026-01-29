import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, Dimensions, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Award, CheckCircle, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getImageUri } from '../../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExploreTask {
    id: string;
    location: { latitude: number; longitude: number; address?: string };
    waste_category: string;
    severity: string;
    description: string;
    created_at: string;
    status: string;
    media_file?: any;
}

export default function ExploreTasksScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [reports, setReports] = useState<ExploreTask[]>([]);
    const [workerId, setWorkerId] = useState<string | null>(null);
    const [workerWard, setWorkerWard] = useState<string | null>(null);

    const fetchAvailableTasks = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get worker's info
            if (!workerId) {
                const { data: worker } = await supabase
                    .from('workers')
                    .select('id, ward_number, assigned_jurisdiction')
                    .eq('user_id', user.id)
                    .single();

                if (worker) {
                    setWorkerId(worker.id);
                    setWorkerWard(worker.ward_number);
                }
            }

            // Simple query - fetch reports
            const { data, error } = await supabase
                .from('reports')
                .select('id, location, waste_category, severity, description, created_at, status, media_file')
                .is('assigned_worker_id', null)
                .in('status', ['submitted', 'verified', 'approved', 'pending'])
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Supabase error:', error);
                return;
            }

            if (data) {
                setReports(data);
            }
        } catch (e) {
            console.error('Error fetching available tasks:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, workerId]);

    useEffect(() => {
        fetchAvailableTasks();
    }, [fetchAvailableTasks]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAvailableTasks();
    };

    const handleClaimTask = async (reportId: string) => {
        if (!workerId) {
            Alert.alert('Error', 'Worker profile not found. Please check your registration.');
            return;
        }

        Alert.alert(
            '🎯 Claim This Task?',
            'You will earn +15 bonus points for claiming this task!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Claim Now',
                    style: 'default',
                    onPress: async () => {
                        setClaiming(reportId);
                        try {
                            const slaDeadline = new Date();
                            slaDeadline.setHours(slaDeadline.getHours() + 24);

                            const { data: newTask, error: taskError } = await supabase
                                .from('worker_tasks')
                                .insert({
                                    report_id: reportId,
                                    worker_id: workerId,
                                    assigned_by: user?.id,
                                    task_status: 'assigned',
                                    priority: 'medium',
                                    sla_deadline: slaDeadline.toISOString(),
                                    assignment_notes: 'Self-assigned bonus task',
                                    is_bonus_task: true,
                                    bonus_points: 15
                                })
                                .select()
                                .single();

                            if (taskError) throw taskError;

                            await supabase
                                .from('reports')
                                .update({
                                    assigned_worker_id: workerId,
                                    worker_assigned_at: new Date().toISOString(),
                                    status: 'in_progress'
                                })
                                .eq('id', reportId);

                            Alert.alert(
                                '🎉 Task Claimed!',
                                'You earned +15 bonus points! Head to My Tasks to start working.',
                                [
                                    {
                                        text: 'View Task',
                                        onPress: () => router.push(`/worker-task/${newTask.id}`)
                                    },
                                    { text: 'OK' }
                                ]
                            );

                            setReports(prev => prev.filter(r => r.id !== reportId));
                        } catch (e: any) {
                            console.error('Error claiming task:', e);
                            Alert.alert('Error', e.message || 'Failed to claim task');
                        } finally {
                            setClaiming(null);
                        }
                    }
                }
            ]
        );
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return '#EF4444';
            case 'high': return '#F97316';
            case 'medium': return '#EAB308';
            default: return '#22C55E';
        }
    };

    const getSeverityLabel = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return '🔴 Critical';
            case 'high': return '🟠 High';
            case 'medium': return '🟡 Medium';
            default: return '🟢 Low';
        }
    };

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const created = new Date(date);
        const diff = now.getTime() - created.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return created.toLocaleDateString();
    };

    const renderPost = (report: ExploreTask) => {
        const imageUri = report.media_file ? getImageUri(report.media_file) : null;
        const isClaiming = claiming === report.id;

        return (
            <View key={report.id} style={styles.postContainer}>
                {/* Header */}
                <View style={styles.postHeader}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>📍</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.categoryText}>
                                {report.waste_category?.replace(/_/g, ' ') || 'Environmental Issue'}
                            </Text>
                            <View style={styles.locationRow}>
                                <MapPin size={12} color="#6B7280" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {report.location?.address || 'Tap to view location'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) + '20' }]}>
                        <Text style={[styles.severityText, { color: getSeverityColor(report.severity) }]}>
                            {getSeverityLabel(report.severity)}
                        </Text>
                    </View>
                </View>

                {/* Image */}
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.noImageContainer}>
                        <Text style={styles.noImageIcon}>📸</Text>
                        <Text style={styles.noImageText}>No image attached</Text>
                    </View>
                )}

                {/* Content */}
                <View style={styles.postContent}>
                    {/* Time & Status */}
                    <View style={styles.metaRow}>
                        <View style={styles.timeContainer}>
                            <Clock size={14} color="#6B7280" />
                            <Text style={styles.timeText}>{formatTimeAgo(report.created_at)}</Text>
                        </View>
                        <View style={styles.pointsBadge}>
                            <Award size={14} color="#F59E0B" />
                            <Text style={styles.pointsText}>+15 pts</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.descriptionText} numberOfLines={3}>
                        {report.description || 'No description provided for this report.'}
                    </Text>

                    {/* Claim Button */}
                    <TouchableOpacity
                        style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
                        onPress={() => handleClaimTask(report.id)}
                        disabled={isClaiming}
                        activeOpacity={0.8}
                    >
                        {isClaiming ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <CheckCircle size={20} color="#FFF" />
                                <Text style={styles.claimButtonText}>Claim This Task</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Finding available tasks...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Explore Tasks</Text>
                <View style={styles.headerSubtitleRow}>
                    <Award size={16} color="#F59E0B" />
                    <Text style={styles.headerSubtitle}>
                        Claim bonus tasks for extra points • Ward {workerWard || 'All'}
                    </Text>
                </View>
            </View>

            {/* Feed - Using ScrollView instead of FlatList */}
            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                    />
                }
            >
                {reports.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🎉</Text>
                        <Text style={styles.emptyTitle}>All Caught Up!</Text>
                        <Text style={styles.emptySubtitle}>
                            No available tasks right now.{'\n'}Pull down to refresh or check back later!
                        </Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                            <RefreshCw size={18} color="#3B82F6" />
                            <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    reports.map(report => renderPost(report))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    listContent: {
        paddingBottom: 100,
    },
    postContainer: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 18,
    },
    headerInfo: {
        flex: 1,
    },
    categoryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        textTransform: 'capitalize',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        flex: 1,
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    postImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.7,
    },
    noImageContainer: {
        width: SCREEN_WIDTH,
        height: 150,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noImageIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    noImageText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    postContent: {
        padding: 14,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 4,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pointsText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D97706',
        marginLeft: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 14,
    },
    claimButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    claimButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    claimButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
    },
    refreshButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3B82F6',
        marginLeft: 8,
    },
});
