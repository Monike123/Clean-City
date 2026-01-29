import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { dataSyncService } from '../services/dataSyncService';
import { ReportService } from '../services/reportService';
import { getImageUri, getReportImageCached } from '../utils/imageUtils';
import { Clock, MapPin, CheckCircle, AlertCircle, Loader, ImageIcon } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Report {
    id: string;
    description?: string;
    media_file?: any;
    created_at: string;
    status: string;
    severity: string;
    waste_category?: string;
    location?: { latitude: number; longitude: number; address?: string };
}

// Lazy loading image component with caching
const LazyImage = memo(({ reportId }: { reportId: string }) => {
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
            <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="small" color="#9CA3AF" />
            </View>
        );
    }

    if (error || !imageUri) {
        return (
            <View style={styles.noImage}>
                <Text style={styles.noImageIcon}>📷</Text>
                <Text style={styles.noImageText}>No Image</Text>
            </View>
        );
    }

    return (
        <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setError(true)}
        />
    );
});

export function ReportsFeed() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReports = useCallback(async (forceRefresh = false) => {
        try {
            // Try local cache first (FAST - no network)
            if (!forceRefresh) {
                const cached = await dataSyncService.getData<Report[]>('all_reports');
                if (cached && cached.length > 0) {
                    console.log('[Feed] Using cached data:', cached.length, 'reports');
                    setReports(cached);
                    setLoading(false);
                    return;
                }
            }

            // Fallback to network
            const data = forceRefresh
                ? await ReportService.refreshAllReports(20)
                : await ReportService.getAllReports(20);
            setReports(data);
        } catch (e) {
            console.error('Feed error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReports(true);
    };

    const handleReportPress = (reportId: string) => {
        router.push(`/report/${reportId}`);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return '#EF4444';
            case 'high': return '#F97316';
            case 'medium': return '#EAB308';
            default: return '#22C55E';
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
                return { label: 'Resolved', color: '#22C55E', icon: CheckCircle };
            case 'in_progress':
                return { label: 'In Progress', color: '#3B82F6', icon: Loader };
            case 'verified':
                return { label: 'Verified', color: '#8B5CF6', icon: CheckCircle };
            default:
                return { label: 'Submitted', color: '#6B7280', icon: AlertCircle };
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const renderReportCard = (report: Report) => {
        const statusInfo = getStatusInfo(report.status);
        const StatusIcon = statusInfo.icon;

        return (
            <TouchableOpacity
                key={report.id}
                style={styles.card}
                onPress={() => handleReportPress(report.id)}
                activeOpacity={0.9}
            >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: getSeverityColor(report.severity) + '20' }]}>
                        <Text style={[styles.categoryText, { color: getSeverityColor(report.severity) }]}>
                            {report.waste_category?.replace(/_/g, ' ') || 'Waste'}
                        </Text>
                    </View>
                    <View style={styles.dateContainer}>
                        <Clock size={12} color="#6B7280" />
                        <Text style={styles.dateText}>{formatDate(report.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <StatusIcon size={12} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                </View>

                {/* Image - Lazy Loaded */}
                <View style={styles.imageContainer}>
                    <LazyImage reportId={report.id} />
                </View>

                {/* Location */}
                {report.location?.address && (
                    <View style={styles.locationRow}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {report.location.address}
                        </Text>
                    </View>
                )}

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>
                    {report.description || 'No description provided.'}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: statusInfo.color,
                                    width: report.status === 'resolved' ? '100%' :
                                        report.status === 'in_progress' ? '60%' :
                                            report.status === 'verified' ? '40%' : '20%'
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {report.status === 'resolved' ? 'Complete' : 'Processing'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
        );
    }

    if (reports.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No Reports Yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to report waste in your area!</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#2E7D32']}
                    tintColor="#2E7D32"
                />
            }
        >
            <Text style={styles.sectionTitle}>Community Reports</Text>
            {reports.map(report => renderReportCard(report))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noImageIcon: {
        fontSize: 40,
        marginBottom: 4,
    },
    noImageText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 6,
    },
    locationText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
});
