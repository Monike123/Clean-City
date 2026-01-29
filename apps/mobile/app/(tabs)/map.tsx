import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { AlertCircle, Filter, Layers } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportService } from '../../services/reportService';
import { CacheService } from '../../services/cacheService';
import { realtimeService } from '../../services/realtimeService';
import { useRouter } from 'expo-router';

export default function MapScreen() {
    const router = useRouter(); // Initialize router
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMapData();

        // Subscribe to real-time updates
        realtimeService.subscribeToNewReports((newReport) => {
            console.log('[MAP] New report received via realtime:', newReport.id);
            setReports(prev => {
                // Check if already exists to prevent duplicates
                if (prev.find(r => r.id === newReport.id)) return prev;

                // Format the new report to match map data structure
                const formatted = formatReportForMap(newReport);
                return [...prev, formatted];
            });
        });

        return () => {
            realtimeService.unsubscribeReports();
        };
    }, []);

    const formatReportForMap = (r: any) => {
        let lat = 0;
        let lng = 0;

        if (r.location) {
            if (typeof r.location === 'object') {
                lat = r.location.latitude || 0;
                lng = r.location.longitude || 0;
            } else if (typeof r.location === 'string') {
                try {
                    const parsed = JSON.parse(r.location);
                    lat = parsed.latitude || 0;
                    lng = parsed.longitude || 0;
                } catch (e) {
                    console.error('[MAP] Failed to parse location:', e);
                }
            }
        }

        return {
            id: r.id,
            lat,
            lng,
            cat: r.waste_category || 'General',
            status: r.status,
            created_at: r.created_at
        };
    };

    const loadMapData = async () => {
        try {
            // Permission & Location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            // Try cache first
            const cacheKey = 'map_all_reports';
            const cached = await CacheService.get(cacheKey);

            if (cached) {
                console.log('[MAP] Loaded from cache:', cached.length, 'reports');
                setReports(cached);
                setLoading(false);
            }

            // Fetch Real Reports
            console.log('[MAP] Fetching reports from database...');
            const data = await ReportService.getAllReports();
            console.log('[MAP] Fetched', data.length, 'reports from DB');

            // Debug first report to see structure
            if (data.length > 0) {
                console.log('[MAP] Sample report:', JSON.stringify(data[0], null, 2));
            }

            const formattedReports = data.map(r => {
                // Handle location field - it might be JSONB object or string
                let lat = 0;
                let lng = 0;

                if (r.location) {
                    if (typeof r.location === 'object') {
                        // Direct object access
                        lat = r.location.latitude || 0;
                        lng = r.location.longitude || 0;
                    } else if (typeof r.location === 'string') {
                        // Parse JSON string
                        try {
                            const parsed = JSON.parse(r.location);
                            lat = parsed.latitude || 0;
                            lng = parsed.longitude || 0;
                        } catch (e) {
                            console.error('[MAP] Failed to parse location for report:', r.id, e);
                        }
                    }
                }

                return {
                    id: r.id,
                    lat,
                    lng,
                    cat: r.waste_category || 'General',
                    status: r.status,
                    created_at: r.created_at
                };
            });

            // Filter out invalid coordinates
            const validReports = formattedReports.filter(r => r.lat !== 0 && r.lng !== 0);
            console.log('[MAP] Valid reports:', validReports.length, 'out of', formattedReports.length);

            // Cache the data
            await CacheService.set(cacheKey, validReports);
            setReports(validReports);
            setLoading(false);
        } catch (error) {
            console.error('[MAP] Error loading map data:', error);
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-background relative">
            {!loading && location ? (
                <MapView
                    style={StyleSheet.absoluteFill}
                    // provider={PROVIDER_GOOGLE} // Use if Google Maps API Key is configured in app.json
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation
                    showsMyLocationButton
                >
                    {reports.map((report) => (
                        <Marker
                            key={report.id}
                            coordinate={{ latitude: report.lat, longitude: report.lng }}
                            title={report.cat}
                            description={`Status: ${report.status}`}
                            pinColor={
                                report.status === 'resolved' ? 'green' :
                                    report.status === 'verified' ? 'blue' : 'red'
                            }
                        >
                            <Callout tooltip onPress={() => router.push(`/report/${report.id}`)}>
                                <View className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 w-48">
                                    <Text className="font-bold text-base mb-1">{report.cat}</Text>
                                    <View className="flex-row items-center mb-1">
                                        <Text className={`text-xs px-2 py-0.5 rounded-full overflow-hidden ${report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                            report.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {report.status.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text className="text-xs text-gray-500 mb-2">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </Text>
                                    <View className="flex-row items-center justify-between border-t border-gray-100 pt-2">
                                        <Text className="text-xs text-primary font-bold">
                                            View Details
                                        </Text>
                                        <Text className="text-xs text-primary">→</Text>
                                    </View>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>
            ) : (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            )}

            {/* Overlay Controls */}
            <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-4 pointer-events-none">
                <View className="bg-white/90 p-3 rounded-full shadow pointer-events-auto">
                    <Filter color="black" size={24} />
                </View>
                <View className="bg-white/90 p-3 rounded-full shadow pointer-events-auto">
                    <Layers color="black" size={24} />
                </View>
            </SafeAreaView>

            <View className="absolute bottom-24 left-4 right-4 bg-white/90 p-4 rounded-xl shadow-lg pointer-events-auto flex-row items-center">
                <View className="bg-primary/20 p-2 rounded-full mr-3">
                    <AlertCircle size={24} color="#2E7D32" />
                </View>
                <View>
                    <Text className="font-bold text-lg">{reports.length} Reports on Map</Text>
                    <Text className="text-gray-500">Tap markers to see details</Text>
                </View>
            </View>
        </View>
    );
}
