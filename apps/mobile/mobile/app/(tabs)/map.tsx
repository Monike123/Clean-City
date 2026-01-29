import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { AlertCircle, Filter, Layers } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportService } from '../../services/reportService';

const MOCK_REPORTS = [
    { id: '1', lat: 28.6139, lng: 77.2090, cat: 'Plastic', status: 'submitted' },
    { id: '2', lat: 28.6129, lng: 77.2295, cat: 'Organic', status: 'verified' },
    { id: '3', lat: 28.6200, lng: 77.2000, cat: 'Metal', status: 'resolved' },
];

export default function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [reports, setReports] = useState<any[]>([]); // Initialize empty
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // Permission & Location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            // Fetch Real Reports
            const data = await ReportService.getAllReports();
            setReports(data.map(r => ({
                id: r.id,
                // Handle JSON location structure or fallback
                lat: r.location?.latitude || 0,
                lng: r.location?.longitude || 0,
                cat: r.waste_category || 'General',
                status: r.status
            })));

            setLoading(false);
        })();
    }, []);

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
                            <Callout>
                                <View className="p-2 w-32">
                                    <Text className="font-bold text-sm">{report.cat}</Text>
                                    <Text className="text-xs text-gray-500 capitalize">{report.status}</Text>
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
                    <Text className="font-bold text-lg">3 Hotspots Nearby</Text>
                    <Text className="text-gray-500">High report density detected.</Text>
                </View>
            </View>
        </View>
    );
}
