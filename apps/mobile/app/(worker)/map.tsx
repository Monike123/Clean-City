import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, RefreshCw, Clock, Navigation, Filter, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
// @ts-ignore
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapMarkerData {
    id: string;
    latitude: number;
    longitude: number;
    address?: string;
    waste_category: string;
    severity: string;
    type: 'assigned' | 'available' | 'other';
    priority?: string;
    sla_deadline?: string;
    task_id?: string;
    status: string;
}

const { width, height } = Dimensions.get('window');

export default function WorkerMapScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [markers, setMarkers] = useState<MapMarkerData[]>([]);
    const [workerId, setWorkerId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'my_tasks' | 'available'>('all');
    const [region, setRegion] = useState({
        latitude: 28.6139, // Default: Delhi
        longitude: 77.209,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });

    const fetchMapData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get worker ID
            const { data: worker } = await supabase
                .from('workers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (worker) {
                setWorkerId(worker.id);
            }

            const allMarkers: MapMarkerData[] = [];

            // 1. Fetch MY assigned tasks
            if (worker) {
                const { data: myTasks } = await supabase
                    .from('worker_tasks')
                    .select(`
                        id,
                        priority,
                        task_status,
                        sla_deadline,
                        report_id,
                        reports (
                            id,
                            location,
                            waste_category,
                            severity,
                            status
                        )
                    `)
                    .eq('worker_id', worker.id)
                    .in('task_status', ['assigned', 'in_progress']);

                if (myTasks) {
                    myTasks.forEach((t: any) => {
                        if (t.reports?.location?.latitude) {
                            allMarkers.push({
                                id: t.reports.id,
                                latitude: t.reports.location.latitude,
                                longitude: t.reports.location.longitude,
                                address: t.reports.location.address,
                                waste_category: t.reports.waste_category,
                                severity: t.reports.severity,
                                type: 'assigned',
                                priority: t.priority,
                                sla_deadline: t.sla_deadline,
                                task_id: t.id,
                                status: t.task_status,
                            });
                        }
                    });
                }
            }

            // 2. Fetch ALL reports (unassigned + available for claiming)
            const { data: allReports } = await supabase
                .from('reports')
                .select('id, location, waste_category, severity, status, assigned_worker_id')
                .in('status', ['submitted', 'verified', 'approved', 'in_progress'])
                .order('created_at', { ascending: false })
                .limit(100);

            if (allReports) {
                allReports.forEach((r: any) => {
                    if (r.location?.latitude) {
                        // Skip if already added as assigned task
                        if (allMarkers.some(m => m.id === r.id)) return;

                        const isAvailable = !r.assigned_worker_id && ['submitted', 'verified', 'approved'].includes(r.status);

                        allMarkers.push({
                            id: r.id,
                            latitude: r.location.latitude,
                            longitude: r.location.longitude,
                            address: r.location.address,
                            waste_category: r.waste_category,
                            severity: r.severity,
                            type: isAvailable ? 'available' : 'other',
                            status: r.status,
                        });
                    }
                });
            }

            setMarkers(allMarkers);

            // Center on first marker
            if (allMarkers.length > 0) {
                // Prioritize assigned tasks for centering
                const assigned = allMarkers.find(m => m.type === 'assigned');
                const centerMarker = assigned || allMarkers[0];
                setRegion({
                    latitude: centerMarker.latitude,
                    longitude: centerMarker.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
        } catch (e) {
            console.error('Error fetching map data:', e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    const getMarkerColor = (marker: MapMarkerData) => {
        if (marker.type === 'assigned') {
            // Use priority colors for assigned tasks
            switch (marker.priority) {
                case 'critical': return '#EF4444';
                case 'high': return '#F97316';
                case 'medium': return '#EAB308';
                default: return '#22C55E';
            }
        }
        if (marker.type === 'available') {
            return '#3B82F6'; // Blue for available
        }
        return '#9CA3AF'; // Gray for others
    };

    const filteredMarkers = markers.filter(m => {
        if (filter === 'all') return true;
        if (filter === 'my_tasks') return m.type === 'assigned';
        if (filter === 'available') return m.type === 'available';
        return true;
    });

    const formatDeadline = (date?: string) => {
        if (!date) return '';
        const deadline = new Date(date);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 0) return 'Overdue!';
        if (hours < 24) return `${hours}h left`;
        return `${Math.floor(hours / 24)}d left`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-textLight font-inter mt-3">Loading map...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                <View>
                    <Text className="text-xl font-inter-bold text-text">Area Map</Text>
                    <Text className="text-sm text-textLight font-inter">
                        {markers.length} reports in your area
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={fetchMapData}
                    className="bg-secondary/10 p-2 rounded-full"
                >
                    <RefreshCw size={20} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 py-2 bg-white border-b border-gray-100">
                <TouchableOpacity
                    className={`px-4 py-2 rounded-full mr-2 ${filter === 'all' ? 'bg-secondary' : 'bg-gray-100'}`}
                    onPress={() => setFilter('all')}
                >
                    <Text className={filter === 'all' ? 'text-white font-inter-bold' : 'text-text font-inter'}>
                        All ({markers.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`px-4 py-2 rounded-full mr-2 ${filter === 'my_tasks' ? 'bg-secondary' : 'bg-gray-100'}`}
                    onPress={() => setFilter('my_tasks')}
                >
                    <Text className={filter === 'my_tasks' ? 'text-white font-inter-bold' : 'text-text font-inter'}>
                        My Tasks ({markers.filter(m => m.type === 'assigned').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`px-4 py-2 rounded-full ${filter === 'available' ? 'bg-secondary' : 'bg-gray-100'}`}
                    onPress={() => setFilter('available')}
                >
                    <Text className={filter === 'available' ? 'text-white font-inter-bold' : 'text-text font-inter'}>
                        Available ({markers.filter(m => m.type === 'available').length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Map View */}
            <View className="flex-1">
                {filteredMarkers.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <MapPin size={64} color="#9CA3AF" />
                        <Text className="text-xl font-inter-bold text-text mt-4 text-center">
                            No Reports Found
                        </Text>
                        <Text className="text-textLight font-inter text-center mt-2">
                            {filter === 'my_tasks' ? 'You have no assigned tasks.' :
                                filter === 'available' ? 'No tasks available to claim.' :
                                    'No reports in this area.'}
                        </Text>
                    </View>
                ) : (
                    <MapView
                        style={{ flex: 1 }}
                        provider={PROVIDER_GOOGLE}
                        region={region}
                        onRegionChangeComplete={setRegion}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {filteredMarkers.map((marker) => (
                            <Marker
                                key={`${marker.type}-${marker.id}`}
                                coordinate={{
                                    latitude: marker.latitude,
                                    longitude: marker.longitude,
                                }}
                                pinColor={getMarkerColor(marker)}
                            >
                                <Callout
                                    onPress={() => {
                                        if (marker.type === 'assigned' && marker.task_id) {
                                            router.push({
                                                pathname: '/worker-task/[id]',
                                                params: { id: marker.task_id }
                                            });
                                        } else if (marker.type === 'available') {
                                            router.push('/(worker)/explore-tasks');
                                        }
                                    }}
                                >
                                    <View style={{ padding: 8, maxWidth: 200 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            {marker.type === 'assigned' ? (
                                                <CheckCircle size={14} color="#22C55E" />
                                            ) : marker.type === 'available' ? (
                                                <AlertCircle size={14} color="#3B82F6" />
                                            ) : (
                                                <MapPin size={14} color="#9CA3AF" />
                                            )}
                                            <Text style={{ marginLeft: 4, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>
                                                {marker.type === 'assigned' ? 'Your Task' :
                                                    marker.type === 'available' ? 'Available' : 'Report'}
                                            </Text>
                                        </View>
                                        <Text style={{ fontWeight: '600', fontSize: 14 }}>
                                            {marker.waste_category?.replace('_', ' ') || 'Environmental Issue'}
                                        </Text>
                                        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                                            Severity: {marker.severity}
                                        </Text>
                                        {marker.address && (
                                            <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                                                {marker.address}
                                            </Text>
                                        )}
                                        {marker.type === 'assigned' && marker.sla_deadline && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <Clock size={12} color="#F59E0B" />
                                                <Text style={{ color: '#F59E0B', fontSize: 11, marginLeft: 4 }}>
                                                    {formatDeadline(marker.sla_deadline)}
                                                </Text>
                                            </View>
                                        )}
                                        <Text style={{ color: '#3B82F6', fontSize: 11, marginTop: 6 }}>
                                            {marker.type === 'assigned' ? 'Tap to view task →' :
                                                marker.type === 'available' ? 'Tap to claim →' : ''}
                                        </Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>
                )}
            </View>

            {/* Legend */}
            <View className="absolute bottom-4 left-4 right-4">
                <View className="bg-white rounded-xl p-3 shadow-lg">
                    <View className="flex-row justify-around">
                        <View className="items-center">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-green-500 mr-1" />
                                <Text className="text-xs font-inter-bold">My Tasks</Text>
                            </View>
                            <Text className="text-xs text-textLight">
                                {markers.filter(m => m.type === 'assigned').length}
                            </Text>
                        </View>
                        <View className="items-center">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-blue-500 mr-1" />
                                <Text className="text-xs font-inter-bold">Available</Text>
                            </View>
                            <Text className="text-xs text-textLight">
                                {markers.filter(m => m.type === 'available').length}
                            </Text>
                        </View>
                        <View className="items-center">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-gray-400 mr-1" />
                                <Text className="text-xs font-inter-bold">Other</Text>
                            </View>
                            <Text className="text-xs text-textLight">
                                {markers.filter(m => m.type === 'other').length}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
