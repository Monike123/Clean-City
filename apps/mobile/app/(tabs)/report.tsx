import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, FileText, Zap, PenTool } from 'lucide-react-native';
import { ReportsFeed } from '../../components/ReportsFeed';

export default function ReportTabScreen() {
    const router = useRouter();

    const handleAIMode = () => {
        router.push({
            pathname: '/report-camera',
            params: { mode: 'ai' }
        });
    };

    const handleManualMode = () => {
        router.push({
            pathname: '/report-camera',
            params: { mode: 'manual' }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Report Waste</Text>
                <Text style={styles.headerSubtitle}>Choose how you want to report</Text>
            </View>

            {/* Two Button Layout - Side by Side */}
            <View style={styles.buttonRow}>
                {/* AI Report Button */}
                <TouchableOpacity
                    style={styles.aiButton}
                    onPress={handleAIMode}
                    activeOpacity={0.8}
                >
                    <View style={styles.buttonIconContainer}>
                        <Sparkles size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.buttonTitle}>AI Report</Text>
                    <View style={styles.badgeRow}>
                        <Zap size={12} color="#FFC107" />
                        <Text style={styles.badgeText}>Quick</Text>
                    </View>
                    <Text style={styles.buttonDesc}>Auto-detect waste</Text>
                </TouchableOpacity>

                {/* Manual Report Button */}
                <TouchableOpacity
                    style={styles.manualButton}
                    onPress={handleManualMode}
                    activeOpacity={0.8}
                >
                    <View style={[styles.buttonIconContainer, { backgroundColor: 'rgba(21, 101, 192, 0.2)' }]}>
                        <FileText size={24} color="#1565C0" />
                    </View>
                    <Text style={[styles.buttonTitle, { color: '#1F2937' }]}>Manual</Text>
                    <View style={styles.badgeRow}>
                        <PenTool size={12} color="#1565C0" />
                        <Text style={[styles.badgeText, { color: '#1565C0' }]}>Detailed</Text>
                    </View>
                    <Text style={[styles.buttonDesc, { color: '#6B7280' }]}>Fill form yourself</Text>
                </TouchableOpacity>
            </View>

            {/* Reports Feed */}
            <ReportsFeed />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    aiButton: {
        flex: 1,
        backgroundColor: '#2E7D32',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    manualButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFC107',
    },
    buttonDesc: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
});
