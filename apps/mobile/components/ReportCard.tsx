import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Clock, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react-native';
import { getImageUri } from '../utils/imageUtils';

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

interface ReportCardProps {
    report: Report;
    onPress?: () => void;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
    const imageUri = report.media_file ? getImageUri(report.media_file) : null;

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

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const created = new Date(date);
        const diff = now.getTime() - created.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return created.toLocaleDateString();
    };

    const statusInfo = getStatusInfo(report.status);
    const StatusIcon = statusInfo.icon;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.categoryBadge, { backgroundColor: getSeverityColor(report.severity) + '20' }]}>
                        <Text style={[styles.categoryText, { color: getSeverityColor(report.severity) }]}>
                            {report.waste_category?.replace(/_/g, ' ') || 'Waste'}
                        </Text>
                    </View>
                    <View style={styles.timeContainer}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={styles.timeText}>{formatTimeAgo(report.created_at)}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <StatusIcon size={12} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
            </View>

            {/* Image */}
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={styles.noImage}>
                    <Text style={styles.noImageIcon}>📷</Text>
                    <Text style={styles.noImageText}>No image</Text>
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
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
                <View style={styles.progressContainer}>
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
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
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
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
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
    image: {
        width: SCREEN_WIDTH - 32,
        height: (SCREEN_WIDTH - 32) * 0.6,
        marginHorizontal: 16,
        borderRadius: 12,
    },
    noImage: {
        width: SCREEN_WIDTH - 32,
        height: 120,
        marginHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noImageIcon: {
        fontSize: 32,
    },
    noImageText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    content: {
        padding: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    locationText: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
});
