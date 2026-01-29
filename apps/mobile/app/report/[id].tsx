import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThumbsUp, Share2, MapPin, Clock, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { ReportService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import * as Progress from 'react-native-progress';
import { getImageUri } from '../../utils/imageUtils';

export default function ReportDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [sharesCount, setSharesCount] = useState(0);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        if (id) {
            loadReport();
            checkIfLiked();
        }
    }, [id]);

    const loadReport = async () => {
        try {
            const data = await ReportService.getReportById(id as string);
            if (data) {
                setReport(data);
                setLikesCount(data.likes_count || 0);
                setSharesCount(data.shares_count || 0);
            }
        } catch (error) {
            console.error('Error loading report:', error);
            Alert.alert('Error', 'Could not load report details');
        } finally {
            setLoading(false);
        }
    };

    const checkIfLiked = async () => {
        if (!user?.id) return;

        try {
            const { data } = await supabase
                .from('report_likes')
                .select('id')
                .eq('report_id', id)
                .eq('user_id', user.id)
                .single();

            if (data) {
                setLiked(true);
            }
        } catch (error) {
            // Not liked
        }
    };

    const handleLike = async () => {
        if (!user?.id || liking) return;
        setLiking(true);

        try {
            if (liked) {
                await supabase
                    .from('report_likes')
                    .delete()
                    .eq('report_id', id)
                    .eq('user_id', user.id);

                setLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase
                    .from('report_likes')
                    .insert({ report_id: id, user_id: user.id });

                setLiked(true);
                setLikesCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Like error:', error);
        } finally {
            setLiking(false);
        }
    };

    const handleShare = async () => {
        try {
            let locationText = 'Unknown Location';
            if (report.location) {
                const loc = typeof report.location === 'object' ? report.location : JSON.parse(report.location);
                locationText = loc.address || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`;
            }

            const message = `🌱 Waste Report: ${report.waste_category || 'Environmental Issue'}\n📍 ${locationText}\n\nHelp us keep our environment clean! #EcoTracker`;

            const result = await Share.share({ message });

            if (result.action === Share.sharedAction) {
                await supabase
                    .from('reports')
                    .update({ shares_count: (sharesCount + 1) })
                    .eq('id', id);

                setSharesCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const getProgressPercentage = () => {
        if (!report) return 0;
        const status = report.status?.toLowerCase() || 'submitted';
        switch (status) {
            case 'resolved':
            case 'approved':
            case 'closed': return 100;
            case 'pending_verification': return 80;
            case 'scheduled':
            case 'in_progress': return 50;
            case 'verified':
            case 'assigned': return 25;
            default: return 10; // submitted/pending
        }
    };

    const getProgressColor = () => {
        const progress = getProgressPercentage();
        if (progress === 100) return '#4CAF50';
        if (progress >= 50) return '#2196F3';
        if (progress > 0) return '#FF9800';
        return '#F44336';
    };

    const getStatusText = () => {
        if (!report) return 'Unknown';
        const status = report.status?.toLowerCase() || 'submitted';
        switch (status) {
            case 'resolved':
            case 'approved':
            case 'closed': return 'Resolved ✅';
            case 'pending_verification': return 'Pending Verification 🔍';
            case 'in_progress': return 'In Progress 🔄';
            case 'scheduled': return 'Scheduled 📅';
            case 'verified':
            case 'assigned': return 'Verified ✓';
            default: return 'Submitted 📤';
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#2E7D32" />
            </SafeAreaView>
        );
    }

    if (!report) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-5">
                <AlertTriangle size={64} color="#EF4444" />
                <Text className="text-xl font-inter-bold text-text mt-4">Report Not Found</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-full mt-6">
                    <Text className="text-white font-inter-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    let locationText = 'Unknown Location';
    if (report.location) {
        const loc = typeof report.location === 'object' ? report.location : JSON.parse(report.location);
        locationText = loc.address || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`;
    }

    const progress = getProgressPercentage();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                {/* Custom Header */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-lg font-inter-bold">Report</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Report Image */}
                    {/* Report Image */}
                    {report.media_file && (() => {
                        const imageUri = getImageUri(report.media_file);
                        return imageUri ? (
                            <View>
                                <Image
                                    source={{ uri: imageUri }}
                                    className="w-full h-64"
                                    resizeMode="cover"
                                />
                                {report.status === 'RESOLVED' && (
                                    <View className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full">
                                        <Text className="text-white text-xs font-inter-bold">BEFORE</Text>
                                    </View>
                                )}
                            </View>
                        ) : null;
                    })()}

                    {/* Resolution Proof (After) */}
                    {report.resolution_image_url && (
                        <View className="mt-1">
                            <Image
                                source={{ uri: report.resolution_image_url }}
                                className="w-full h-64"
                                resizeMode="cover"
                            />
                            <View className="absolute top-4 left-4 bg-green-600/80 px-3 py-1 rounded-full">
                                <Text className="text-white text-xs font-inter-bold">AFTER (RESOLVED)</Text>
                            </View>
                        </View>
                    )}

                    {/* Action Bar - Instagram Style */}
                    <View className="bg-white px-4 py-3 flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-4">
                            <TouchableOpacity onPress={handleLike} disabled={liking} className="flex-row items-center">
                                <ThumbsUp
                                    size={26}
                                    color={liked ? '#2E7D32' : '#262626'}
                                    fill={liked ? '#2E7D32' : 'transparent'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleShare}>
                                <Share2 size={26} color="#262626" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center">
                            <MapPin size={20} color="#757575" />
                        </View>
                    </View>

                    {/* Likes Count */}
                    <View className="px-4 pb-2">
                        <Text className="font-inter-bold text-sm">
                            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                        </Text>
                    </View>

                    {/* Caption - Instagram Style */}
                    <View className="px-4 pb-3">
                        <Text className="text-sm text-gray-900 leading-5">
                            <Text className="font-inter-bold">{report.waste_category || 'Waste Report'} </Text>
                            {report.description || 'No description provided'}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-2 font-inter">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </Text>
                    </View>

                    {/* Progress Section */}
                    <View className="bg-gray-50 px-4 py-4 border-y border-gray-100">
                        <Text className="text-sm font-inter-bold text-gray-700 mb-2">Resolution Status</Text>
                        <Progress.Bar
                            progress={progress / 100}
                            width={null}
                            height={6}
                            color={getProgressColor()}
                            unfilledColor="#E5E5E5"
                            borderWidth={0}
                            borderRadius={3}
                        />
                        <View className="flex-row justify-between items-center mt-2">
                            <Text className="text-xs text-gray-500 font-inter">{progress}%</Text>
                            <Text className="text-xs font-inter-bold" style={{ color: getProgressColor() }}>
                                {getStatusText()}
                            </Text>
                        </View>
                    </View>

                    {/* Report Details */}
                    <View className="bg-white px-4 py-4">
                        {/* Location */}
                        <View className="mb-4 pb-4 border-b border-gray-100">
                            <View className="flex-row items-center mb-1">
                                <MapPin size={14} color="#999" />
                                <Text className="text-xs text-gray-500 font-inter-bold ml-1">LOCATION</Text>
                            </View>
                            <Text className="text-sm text-gray-800 font-inter ml-5">{locationText}</Text>
                        </View>

                        {/* Severity */}
                        <View className="mb-4 pb-4 border-b border-gray-100">
                            <Text className="text-xs text-gray-500 font-inter-bold mb-2">SEVERITY</Text>
                            <View className={`self-start px-3 py-1.5 rounded-full ${report.severity === 'critical' || report.severity === 'CRITICAL' ? 'bg-red-100' :
                                report.severity === 'high' || report.severity === 'HIGH' ? 'bg-orange-100' :
                                    report.severity === 'medium' || report.severity === 'MEDIUM' ? 'bg-yellow-100' :
                                        'bg-green-100'
                                }`}>
                                <Text className={`font-inter-bold capitalize text-sm ${report.severity === 'critical' || report.severity === 'CRITICAL' ? 'text-red-700' :
                                    report.severity === 'high' || report.severity === 'HIGH' ? 'text-orange-700' :
                                        report.severity === 'medium' || report.severity === 'MEDIUM' ? 'text-yellow-700' :
                                            'text-green-700'
                                    }`}>
                                    {report.severity || 'Low'}
                                </Text>
                            </View>
                        </View>

                        {/* Reported Date */}
                        <View className="mb-4">
                            <View className="flex-row items-center mb-1">
                                <Clock size={14} color="#999" />
                                <Text className="text-xs text-gray-500 font-inter-bold ml-1">REPORTED</Text>
                            </View>
                            <Text className="text-sm text-gray-800 font-inter ml-5">
                                {new Date(report.created_at).toLocaleDateString('en-US', {
                                    month: 'long', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </Text>
                        </View>

                        {/* AI Confidence */}
                        {report.ai_confidence_score && (
                            <View className="mt-2">
                                <Text className="text-xs text-gray-500 font-inter-bold mb-2">AI CONFIDENCE</Text>
                                <View className="flex-row items-center ml-5">
                                    <Progress.Bar
                                        progress={report.ai_confidence_score}
                                        width={150}
                                        height={5}
                                        color="#2E7D32"
                                        unfilledColor="#E5E5E5"
                                        borderWidth={0}
                                        borderRadius={3}
                                    />
                                    <Text className="text-sm font-inter-bold text-primary ml-3">
                                        {Math.round(report.ai_confidence_score * 100)}%
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View className="h-8" />
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
