import { useRef, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, ArrowLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { ReportService } from '../../services/reportService';
import { format } from 'date-fns';
import MapView, { Marker } from 'react-native-maps';

export default function ReportDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadReport(id as string);
        }
    }, [id]);

    const loadReport = async (reportId: string) => {
        const data = await ReportService.getReportById(reportId);
        setReport(data);
        setLoading(false);
    };

    const openMaps = () => {
        if (!report?.location) return;
        const { latitude, longitude } = report.location;
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${latitude},${longitude}`;
        const label = 'Waste Report Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    if (!report) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <Text className="text-textLight font-inter">Report not found.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-primary font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const steps = [
        { status: 'submitted', label: 'Report Submitted', date: report.created_at },
        { status: 'verified', label: 'Verified by AI/Admin', date: null },
        { status: 'resolved', label: 'Cleanup Completed', date: null },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === report.status);
    // Fallback if status doesn't match predefined steps
    const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header Image */}
                <View className="relative h-72 w-full">
                    <Image
                        source={{ uri: report.image_url }}
                        className="w-full h-full bg-gray-200"
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-5 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
                    >
                        <ArrowLeft size={24} color="black" />
                    </TouchableOpacity>

                    <View className="absolute bottom-0 left-0 right-0 bg-black/40 p-4 backdrop-blur-sm">
                        <Text className="text-white text-2xl font-inter-bold capitalize">{report.waste_category} Waste</Text>
                        <View className="flex-row items-center mt-1">
                            <Calendar size={14} color="white" />
                            <Text className="text-white ml-2 text-sm font-inter">
                                {format(new Date(report.created_at), 'MMMM d, yyyy • h:mm a')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="p-5">
                    {/* Status Timeline */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                        <Text className="font-inter-bold text-lg mb-4">Status Timeline</Text>
                        {steps.map((step, index) => {
                            const isActive = index <= activeStep;
                            return (
                                <View key={step.status} className="flex-row mb-4 relative last:mb-0">
                                    {/* Vertical Line */}
                                    {index !== steps.length - 1 && (
                                        <View className={`absolute left-3 top-6 w-[2px] h-full ${index < activeStep ? 'bg-primary' : 'bg-gray-200'
                                            }`} />
                                    )}

                                    <View className={`w-6 h-6 rounded-full items-center justify-center z-10 ${isActive ? 'bg-primary' : 'bg-gray-200'
                                        }`}>
                                        {isActive ? (
                                            <CheckCircle2 size={14} color="white" />
                                        ) : (
                                            <View className="w-2 h-2 rounded-full bg-gray-400" />
                                        )}
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <Text className={`font-bold text-sm ${isActive ? 'text-text' : 'text-textLight'}`}>
                                            {step.label}
                                        </Text>
                                        {step.date && isActive && (
                                            <Text className="text-xs text-textLight mt-0.5">
                                                {format(new Date(step.date), 'MMM d, h:mm a')}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* AI Analysis */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                        <View className="flex-row items-center mb-4">
                            <Text className="font-inter-bold text-lg flex-1">AI Analysis</Text>
                            <View className="bg-purple-100 px-2 py-1 rounded-md">
                                <Text className="text-purple-700 text-xs font-bold">GEMINI 1.5</Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between py-2 border-b border-gray-100">
                            <Text className="text-textLight">Severity</Text>
                            <Text className={`font-bold capitalize ${report.severity === 'critical' ? 'text-red-600' :
                                    report.severity === 'high' ? 'text-orange-600' : 'text-text'
                                }`}>{report.severity}</Text>
                        </View>
                        <View className="flex-row justify-between py-2 border-b border-gray-100">
                            <Text className="text-textLight">Confidence</Text>
                            <Text className="font-bold text-text">{(report.ai_confidence_score * 100).toFixed(0)}%</Text>
                        </View>

                        <Text className="text-textLight mt-3 leading-5 italic">"{report.description}"</Text>

                        {report.metadata?.action && (
                            <View className="mt-4 bg-green-50 p-3 rounded-lg flex-row items-start">
                                <AlertCircle size={18} color="#2E7D32" style={{ marginTop: 2 }} />
                                <Text className="ml-2 text-green-800 flex-1 text-sm">
                                    <Text className="font-bold">Suggested Action: </Text>
                                    {report.metadata.action}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Location Map */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="font-inter-bold text-lg">Location</Text>
                            <TouchableOpacity onPress={openMaps}>
                                <Text className="text-primary font-bold text-sm">Open in Maps</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="h-40 rounded-xl overflow-hidden bg-gray-100 relative">
                            <MapView
                                style={{ width: '100%', height: '100%' }}
                                initialRegion={{
                                    latitude: report.location.latitude,
                                    longitude: report.location.longitude,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: report.location.latitude,
                                        longitude: report.location.longitude
                                    }}
                                />
                            </MapView>
                        </View>
                        <View className="flex-row items-start mt-3">
                            <MapPin size={16} color="#4B5563" style={{ marginTop: 2 }} />
                            <Text className="ml-2 text-textLight flex-1">{report.location.address}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
