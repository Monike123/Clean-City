import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    MapPin,
    Clock,
    CheckCircle,
    AlertTriangle,
    Navigation,
    Camera,
    Send
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { getImageUri } from '../../utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

interface WorkerTask {
    id: string;
    report_id: string;
    worker_id: string;
    task_status: string;
    priority: string;
    sla_deadline: string;
    started_at?: string;
    completed_at?: string;
    resolution_notes?: string;
    resolution_proof?: any;
    reports?: {
        id: string;
        description: string;
        location: { latitude: number; longitude: number; address?: string };
        waste_category: string;
        severity: string;
        media_file?: any;
    };
}

export default function WorkerTaskDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [task, setTask] = useState<WorkerTask | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [proofImage, setProofImage] = useState<string | null>(null);

    const fetchTask = useCallback(async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('worker_tasks')
                .select(`
                    *,
                    reports (
                        id,
                        description,
                        location,
                        waste_category,
                        severity,
                        media_file
                    )
                `)
                .eq('id', id)
                .single();

            if (!error && data) {
                setTask(data);
            }
        } catch (e) {
            console.error('Error fetching task:', e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTask();
    }, [fetchTask]);

    const handleStartTask = async () => {
        if (!task) return;

        try {
            await supabase
                .from('worker_tasks')
                .update({
                    task_status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', task.id);

            setTask({ ...task, task_status: 'in_progress', started_at: new Date().toISOString() });
            Alert.alert('Task Started', 'You have started working on this task.');
        } catch (e) {
            Alert.alert('Error', 'Failed to start task');
        }
    };

    const handleTakeProof = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to capture proof.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setProofImage(result.assets[0].uri);
        }
    };

    const handleSubmitResolution = async () => {
        if (!task || !resolutionNotes.trim()) {
            Alert.alert('Required', 'Please enter resolution notes.');
            return;
        }

        setSubmitting(true);
        try {
            // Get current location
            const { status } = await Location.requestForegroundPermissionsAsync();
            let resolutionLocation = null;
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                resolutionLocation = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                };
            }

            // Upload proof image if available
            let proofUrl = null;
            if (proofImage) {
                try {
                    const fileName = `proof_${task.id}_${Date.now()}.jpg`;

                    // Fetch the image as a blob
                    const response = await fetch(proofImage);
                    const blob = await response.blob();

                    // Create array buffer from blob for upload
                    const arrayBuffer = await new Response(blob).arrayBuffer();

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('resolution-proofs')
                        .upload(fileName, arrayBuffer, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    console.log('[WorkerTask] Upload result:', uploadData, uploadError);

                    if (!uploadError && uploadData) {
                        const { data: urlData } = supabase.storage
                            .from('resolution-proofs')
                            .getPublicUrl(fileName);
                        proofUrl = urlData.publicUrl;
                        console.log('[WorkerTask] Proof URL:', proofUrl);
                    } else {
                        console.error('[WorkerTask] Upload error:', uploadError);
                    }
                } catch (uploadErr) {
                    console.error('[WorkerTask] Image upload failed:', uploadErr);
                    // Continue without proof image
                }
            }

            // Update task - mark as completed (pending admin verification)
            console.log('[WorkerTask] Updating task:', task.id, 'to completed');
            const { data: taskUpdateData, error: taskUpdateError } = await supabase
                .from('worker_tasks')
                .update({
                    task_status: 'completed',
                    completed_at: new Date().toISOString(),
                    resolution_notes: resolutionNotes,
                    resolution_proof: proofUrl ? { url: proofUrl } : null,
                    resolution_location: resolutionLocation
                })
                .eq('id', task.id)
                .select();

            console.log('[WorkerTask] Task update result:', taskUpdateData, taskUpdateError);
            if (taskUpdateError) throw taskUpdateError;

            // Update report status to pending verification (NOT resolved yet - admin must verify)
            console.log('[WorkerTask] Updating report:', task.report_id, 'to pending_verification');
            const { data: reportUpdateData, error: reportUpdateError } = await supabase
                .from('reports')
                .update({ status: 'pending_verification' })
                .eq('id', task.report_id)
                .select();

            console.log('[WorkerTask] Report update result:', reportUpdateData, reportUpdateError);
            if (reportUpdateError) throw reportUpdateError;

            Alert.alert('Success!', 'Task completed successfully!', [
                { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(worker)/dashboard') }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to submit resolution');
        } finally {
            setSubmitting(false);
        }
    };

    const openMaps = () => {
        if (!task?.reports?.location) return;
        const { latitude, longitude } = task.reports.location;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(url);
    };

    const formatDeadline = (date: string) => {
        const deadline = new Date(date);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 0) return { text: 'Overdue!', color: '#EF4444' };
        if (hours < 4) return { text: `${hours}h left`, color: '#F97316' };
        if (hours < 24) return { text: `${hours}h left`, color: '#EAB308' };
        return { text: `${Math.floor(hours / 24)}d left`, color: '#22C55E' };
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return '#EF4444';
            case 'high': return '#F97316';
            case 'medium': return '#EAB308';
            default: return '#22C55E';
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    if (!task) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
                <AlertTriangle size={64} color="#EF4444" />
                <Text className="text-xl font-inter-bold text-text mt-4">Task Not Found</Text>
                <TouchableOpacity
                    className="bg-secondary px-6 py-3 rounded-xl mt-6"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-inter-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const deadlineInfo = task.sla_deadline ? formatDeadline(task.sla_deadline) : null;
    const reportImage = task.reports?.media_file ? getImageUri(task.reports.media_file) : null;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-lg font-inter-bold text-text">Task Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Priority & SLA */}
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center" style={{ backgroundColor: getPriorityColor(task.priority) + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getPriorityColor(task.priority) }} />
                            <Text style={{ color: getPriorityColor(task.priority), fontWeight: 'bold', marginLeft: 6, textTransform: 'uppercase' }}>
                                {task.priority}
                            </Text>
                        </View>
                        {deadlineInfo && (
                            <View className="flex-row items-center">
                                <Clock size={16} color={deadlineInfo.color} />
                                <Text style={{ color: deadlineInfo.color, fontWeight: 'bold', marginLeft: 4 }}>
                                    {deadlineInfo.text}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Report Image */}
                    {reportImage && (
                        <Image
                            source={{ uri: reportImage }}
                            className="w-full h-48 rounded-xl mb-4"
                            resizeMode="cover"
                        />
                    )}

                    {/* Report Details */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                        <Text className="text-lg font-inter-bold text-text mb-2">
                            {task.reports?.waste_category?.replace('_', ' ') || 'Environmental Issue'}
                        </Text>
                        <Text className="text-textLight font-inter mb-4">
                            {task.reports?.description || 'No description available'}
                        </Text>

                        {/* Location */}
                        <TouchableOpacity
                            className="flex-row items-center bg-blue-50 p-3 rounded-lg"
                            onPress={openMaps}
                        >
                            <Navigation size={20} color="#3B82F6" />
                            <Text className="text-secondary font-inter-bold ml-2 flex-1" numberOfLines={1}>
                                {task.reports?.location?.address || 'Navigate to location'}
                            </Text>
                            <MapPin size={16} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>

                    {/* Status Badge */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                        <Text className="font-inter-bold text-text mb-2">Task Status</Text>
                        <View className={`px-4 py-2 rounded-lg self-start ${task.task_status === 'completed' ? 'bg-green-100' :
                            task.task_status === 'in_progress' ? 'bg-blue-100' :
                                'bg-yellow-100'
                            }`}>
                            <Text className={`font-inter-bold capitalize ${task.task_status === 'completed' ? 'text-green-700' :
                                task.task_status === 'in_progress' ? 'text-blue-700' :
                                    'text-yellow-700'
                                }`}>
                                {task.task_status?.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>

                    {/* Actions based on status */}
                    {task.task_status === 'assigned' && (
                        <TouchableOpacity
                            className="bg-primary py-4 rounded-xl items-center mb-4"
                            onPress={handleStartTask}
                        >
                            <Text className="text-white font-inter-bold text-lg">Start Task</Text>
                        </TouchableOpacity>
                    )}

                    {task.task_status === 'in_progress' && (
                        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                            <Text className="font-inter-bold text-text mb-4">Submit Resolution</Text>

                            {/* Proof Image */}
                            <TouchableOpacity
                                className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-4"
                                onPress={handleTakeProof}
                            >
                                {proofImage ? (
                                    <Image source={{ uri: proofImage }} className="w-full h-32 rounded-lg" resizeMode="cover" />
                                ) : (
                                    <>
                                        <Camera size={32} color="#9CA3AF" />
                                        <Text className="text-textLight font-inter mt-2">Take Proof Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Resolution Notes */}
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[100px] text-text font-inter"
                                placeholder="Describe how you resolved this issue..."
                                value={resolutionNotes}
                                onChangeText={setResolutionNotes}
                                multiline
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                className={`bg-green-600 py-4 rounded-xl items-center flex-row justify-center mt-4 ${submitting ? 'opacity-70' : ''}`}
                                onPress={handleSubmitResolution}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <CheckCircle size={20} color="#FFF" />
                                        <Text className="text-white font-inter-bold text-lg ml-2">Submit Resolution</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {task.task_status === 'completed' && (
                        <View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200 items-center">
                            <CheckCircle size={48} color="#22C55E" />
                            <Text className="text-green-700 font-inter-bold text-lg mt-2">Task Completed!</Text>
                            {task.resolution_notes && (
                                <Text className="text-green-600 font-inter text-center mt-2">
                                    {task.resolution_notes}
                                </Text>
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
