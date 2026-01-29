import React, { useEffect, useState, memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, FileDown, MapPin, Clock, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { ReportService } from '../../services/reportService';
import { CacheService } from '../../services/cacheService';
import { formatDistanceToNow } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getImageUri, getReportImageCached } from '../../utils/imageUtils';

// Lazy loading image component for home page (with caching)
const LazyReportImage = memo(({ reportId }: { reportId: string }) => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadImage = async () => {
            try {
                // Uses cache - instant if already loaded before
                const uri = await getReportImageCached(reportId);

                if (mounted && uri) {
                    setImageUri(uri);
                }
            } catch (e) {
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadImage();
        return () => { mounted = false; };
    }, [reportId]);

    if (loading) {
        return (
            <View className="w-full h-48 bg-gray-100 items-center justify-center">
                <ActivityIndicator size="small" color="#9CA3AF" />
            </View>
        );
    }

    if (!imageUri || error) {
        return (
            <View className="w-full h-48 bg-gray-100 items-center justify-center">
                <Text className="text-4xl">📷</Text>
                <Text className="text-gray-400 mt-2">No Image</Text>
            </View>
        );
    }

    return (
        <Image
            source={{ uri: imageUri }}
            className="w-full h-48"
            resizeMode="cover"
            onError={() => setError(true)}
        />
    );
});

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ reports: 0, points: 0, trees: 0 });
    const [recentReports, setRecentReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadUserData();
        }
    }, [user?.id]);

    const loadUserData = async () => {
        if (!user) return;

        try {
            // Try cache first
            const cacheKey = `user_reports_${user.id}`;
            const cached = await CacheService.get(cacheKey);

            if (cached && !refreshing) {
                setRecentReports(cached);
                calculateStats(cached);
                setLoading(false);
            }

            // Fetch fresh data in background
            const reports = await ReportService.getUserReports(user.id);

            // Cache the fresh data
            await CacheService.set(cacheKey, reports);

            setRecentReports(reports || []);
            calculateStats(reports || []);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (reports: any[]) => {
        const points = user?.eco_points || 0;
        const trees = Math.floor(points / 100);

        setStats({
            reports: reports.length,
            points: points,
            trees: trees
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadUserData();
    };

    const generatePDF = async (report: any) => {
        try {
            let locationText = 'Unknown Location';
            if (report.location) {
                const loc = typeof report.location === 'string' ? JSON.parse(report.location) : report.location;
                locationText = loc.address || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`;
            }

            // Fetch image for PDF
            const mediaFile = await ReportService.getReportImage(report.id);
            const imageBase64 = mediaFile ? getImageUri(mediaFile) : null;

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #2E7D32; }
                        img { width: 100%; max-width: 500px; height: auto; margin: 20px 0; }
                        .field { margin: 15px 0; }
                        .label { font-weight: bold; color: #555; }
                        .status { 
                            display: inline-block; 
                            padding: 5px 10px; 
                            border-radius: 5px; 
                            background: #4CAF50; 
                            color: white; 
                            text-transform: capitalize;
                        }
                    </style>
                </head>
                <body>
                    <h1>🌱 Waste Report #${report.id.substring(0, 8)}</h1>
                    ${imageBase64 ? `<img src="${imageBase64}" alt="Report Image"/>` : ''}
                    
                    <div class="field">
                        <span class="label">Category:</span> ${report.waste_category || 'Not specified'}
                    </div>
                    <div class="field">
                        <span class="label">Location:</span> ${locationText}
                    </div>
                    <div class="field">
                        <span class="label">Status:</span> <span class="status">${report.status || 'submitted'}</span>
                    </div>
                    <div class="field">
                        <span class="label">Severity:</span> ${report.severity || 'medium'}
                    </div>
                    <div class="field">
                        <span class="label">Description:</span> ${report.description || 'No description provided'}
                    </div>
                    <div class="field">
                        <span class="label">Submitted:</span> ${new Date(report.created_at).toLocaleString()}
                    </div>
                    <div class="field">
                        <span class="label">AI Confidence:</span> ${Math.round((report.ai_confidence_score || 0) * 100)}%
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Report PDF',
                UTI: 'com.adobe.pdf'
            });
        } catch (error) {
            console.error('PDF generation error:', error);
            Alert.alert('Error', 'Could not generate PDF. Please try again.');
        }
    };

    if (loading && recentReports.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#2E7D32" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <ScrollView
                className="flex-1 p-5"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
                }
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-xl font-inter-bold text-text">Hello, {user?.full_name?.split(' ')[0] || 'Explorer'}!</Text>
                        <Text className="text-sm text-textLight font-inter">Ready to save the planet?</Text>
                    </View>
                    <View className="w-11 h-11 rounded-full bg-green-50 items-center justify-center">
                        <Leaf size={24} color="#2E7D32" />
                    </View>
                </View>

                {/* Impact Card */}
                <View className="bg-primary rounded-[20px] p-5 mb-6 shadow-sm">
                    <Text className="text-white text-base font-inter-bold mb-4">Your Impact</Text>
                    <View className="flex-row justify-between items-center">
                        <View className="items-center flex-1">
                            <Text className="text-white text-2xl font-inter-bold">{stats.reports}</Text>
                            <Text className="text-white text-xs opacity-90 font-inter">Reports</Text>
                        </View>
                        <View className="w-[1px] h-8 bg-white opacity-30" />
                        <View className="items-center flex-1">
                            <Text className="text-white text-2xl font-inter-bold">{stats.points}</Text>
                            <Text className="text-white text-xs opacity-90 font-inter">Eco-Points</Text>
                        </View>
                        <View className="w-[1px] h-8 bg-white opacity-30" />
                        <View className="items-center flex-1">
                            <Text className="text-white text-2xl font-inter-bold">{stats.trees}</Text>
                            <Text className="text-white text-xs opacity-90 font-inter">Trees Saved</Text>
                        </View>
                    </View>
                </View>

                {/* My Recent Reports */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-inter-bold text-text">My Reports</Text>
                    <Text className="text-xs text-textLight font-inter">{recentReports.length} total</Text>
                </View>

                {recentReports.length === 0 ? (
                    <View className="bg-card p-8 rounded-2xl items-center justify-center">
                        <AlertCircle size={48} color="#9CA3AF" />
                        <Text className="text-textLight font-inter mt-4 text-center">No reports yet</Text>
                        <Text className="text-textLight font-inter text-xs mt-1 text-center">Start reporting waste to earn EcoPoints!</Text>
                    </View>
                ) : (
                    recentReports.map((report) => {
                        let locationText = 'Unknown Location';
                        if (report.location) {
                            const loc = typeof report.location === 'object' ? report.location : JSON.parse(report.location);
                            locationText = loc.address || `${loc.latitude?.toFixed(2)}, ${loc.longitude?.toFixed(2)}`;
                        }

                        return (
                            <TouchableOpacity
                                key={report.id}
                                className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                                onPress={() => router.push(`/report/${report.id}`)}
                                activeOpacity={0.7}
                            >
                                {/* Report Image - Lazy Loaded */}
                                <LazyReportImage reportId={report.id} />

                                {/* Report Details */}
                                <View className="p-4">
                                    {/* Category & Status */}
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-base font-inter-bold text-text capitalize">
                                            {report.waste_category || 'Waste Report'}
                                        </Text>
                                        <View className={`px-3 py-1 rounded-full ${report.status === 'RESOLVED' ? 'bg-green-100' :
                                            report.status === 'IN_PROGRESS' ? 'bg-blue-100' :
                                                report.status === 'verified' ? 'bg-green-100' :
                                                    'bg-orange-100'
                                            }`}>
                                            <Text className={`text-xs font-inter-bold ${report.status === 'RESOLVED' ? 'text-green-700' :
                                                report.status === 'IN_PROGRESS' ? 'text-blue-700' :
                                                    report.status === 'verified' ? 'text-green-700' :
                                                        'text-orange-700'
                                                }`}>
                                                {report.status || 'submitted'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Location */}
                                    <View className="flex-row items-center mb-2">
                                        <MapPin size={14} color="#757575" />
                                        <Text className="text-xs text-textLight ml-2 font-inter flex-1" numberOfLines={1}>
                                            {locationText}
                                        </Text>
                                    </View>

                                    {/* Time */}
                                    <View className="flex-row items-center mb-4">
                                        <Clock size={14} color="#757575" />
                                        <Text className="text-xs text-textLight ml-2 font-inter">
                                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                        </Text>
                                    </View>

                                    {/* Description Preview */}
                                    {report.description && (
                                        <Text className="text-sm text-gray-600 font-inter mb-4" numberOfLines={2}>
                                            {report.description}
                                        </Text>
                                    )}

                                    {/* PDF Download Button */}
                                    <TouchableOpacity
                                        className="bg-primary/10 p-3 rounded-xl flex-row items-center justify-center"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            generatePDF(report);
                                        }}
                                    >
                                        <FileDown size={18} color="#2E7D32" />
                                        <Text className="text-primary font-inter-bold ml-2">Download PDF Report</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
