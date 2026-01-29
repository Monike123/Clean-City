import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, StyleSheet, TextInput, ScrollView, Switch } from 'react-native';
import { Leaf, RefreshCw, Zap, MapPin, AlertTriangle, Droplets, User, Clock, ThermometerSun } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GeminiService } from '../../services/gemini';
import { ReportService } from '../../services/reportService';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';

export default function ReportScreen() {
    const [step, setStep] = useState<1 | 2>(1);
    const [analyzing, setAnalyzing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // analysisResult holds ALL report data (AI or Manual)
    // Structure: { waste_types_detected, severity_level, summary_for_dashboard, ...manualFields }
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string>('Fetching location...');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const { user } = useAuthStore();
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setAddress('Location permission denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            // Reverse Geocode
            try {
                let reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });

                if (reverseGeocode.length > 0) {
                    const addr = reverseGeocode[0];
                    setAddress(`${addr.name || ''} ${addr.street || ''}, ${addr.city}`);
                }
            } catch (e) {
                setAddress(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
            }
        })();
    }, []);

    if (!permission) {
        return (
            <View className="flex-1 justify-center items-center bg-black">
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 p-5">
                <Text className="text-center text-lg mb-4 font-inter">We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} className="bg-primary px-6 py-3 rounded-full">
                    <Text className="text-white font-bold font-inter-bold">Grant Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleManualReport = async () => {
        if (!cameraRef.current) return;
        setAnalyzing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.5,
                skipProcessing: true, // Speed up capture
            });

            if (photo?.base64) {
                setCapturedImage(photo.base64);
                // Initialize Blank Form for Manual Mode
                setAnalysisResult({
                    is_manual_mode: true,
                    waste_types_detected: [], // Empty selected categories
                    severity_level: 'Medium',
                    summary_for_dashboard: '', // Blank Description
                    authority_report: '',
                    confidence_percentage: 100,
                    // Manual Fields
                    size: '',
                    duration: '',
                    urgency: 'Normal',
                    hazards: {}, // { sharp: true, toxic: false }
                    impact: { smell: 'No Smell', water_near: false, animals: false, blocked_access: false }
                });
                setStep(2);
            }
        } catch (e) {
            Alert.alert("Error", "Failed to capture image.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current) return;
        setAnalyzing(true);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.5,
                skipProcessing: true,
            });

            if (photo?.base64) {
                setCapturedImage(photo.base64);
                const result = await GeminiService.analyzeImage(photo.base64);

                // If the result indicates manual fallback
                if (result.waste_types_detected.includes('Manual Input Required')) {
                    setAnalysisResult({
                        is_manual_mode: true, // Trigger manual form
                        waste_types_detected: [],
                        severity_level: 'Medium',
                        summary_for_dashboard: '',
                        authority_report: 'Automated analysis failed. Please provide details.',
                        confidence_percentage: 0,
                        hazards: {},
                        impact: {}
                    });
                } else {
                    setAnalysisResult({ ...result, is_manual_mode: false });
                }
                setStep(2);
            }
        } catch (e: any) {
            console.error(e);
            // Fallback to manual
            setAnalysisResult({
                is_manual_mode: true,
                waste_types_detected: [],
                severity_level: 'Medium',
                summary_for_dashboard: '',
                authority_report: '',
                confidence_percentage: 0,
                hazards: {}, // { sharp: true, toxic: false }
                impact: { smell: 'No Smell', water_near: false, animals: false, blocked_access: false }
            });
            setStep(2);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        if (!capturedImage || !analysisResult) return;
        setSubmitting(true);

        try {
            const userId = user?.id || 'anon_user';
            const imageUrl = await ReportService.uploadImage(capturedImage, userId);

            if (!imageUrl) throw new Error("Image upload failed");

            // Construct Report Data with new fields
            const reportData = {
                user_id: userId,
                image_url: imageUrl,
                location: {
                    latitude: location?.coords.latitude || 0,
                    longitude: location?.coords.longitude || 0,
                    address: address
                },
                waste_category: analysisResult.waste_types_detected?.[0] || 'Mixed',
                ai_confidence_score: analysisResult.confidence_percentage ? analysisResult.confidence_percentage / 100 : 1.0,
                description: analysisResult.summary_for_dashboard, // This is the user description
                status: 'submitted',
                severity: analysisResult.severity_level?.toLowerCase() || 'medium',
                metadata: {
                    full_report: analysisResult.authority_report,
                    manual_input: analysisResult.is_manual_mode,
                    // New Fields mapped to metadata (or columns if DB updated)
                    urgency: analysisResult.urgency,
                    size_estimation: analysisResult.size,
                    duration_presence: analysisResult.duration,
                    hazard_indicators: analysisResult.hazards, // JSON object { sharp: true }
                    impact_details: analysisResult.impact // JSON object { smell: 'High' }
                }
            };

            await ReportService.createReport(reportData);

            Alert.alert('Success!', 'Report submitted successfully. +100 EcoPoints earned!', [
                {
                    text: 'OK', onPress: () => {
                        setStep(1);
                        setCapturedImage(null);
                        setAnalysisResult(null);
                    }
                }
            ]);

        } catch (e) {
            Alert.alert("Submission Error", "Could not save your report. Please try again.");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    // --- STEP 2: REPORT FORM (MANUAL & AI) ---
    if (step === 2 && analysisResult) {
        const isManual = analysisResult.is_manual_mode;

        return (
            <SafeAreaView className="flex-1 bg-background">
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View className="items-center mb-6">
                        <Leaf size={50} color="#2E7D32" />
                        <Text className="text-center text-2xl font-inter-bold text-text mt-2">
                            {isManual ? 'New Waste Report' : 'Analysis Complete'}
                        </Text>
                        {!isManual && (
                            <Text className="text-center text-sm text-textLight px-4 font-inter mt-1">
                                Please review the AI analysis below.
                            </Text>
                        )}
                        {isManual && (
                            <Text className="text-center text-sm text-textLight px-4 font-inter mt-1">
                                Please fill in the details of the waste incident.
                            </Text>
                        )}
                    </View>

                    {/* 1. Description Field */}
                    <View className="mb-6">
                        <Text className="text-text font-bold font-inter mb-2">1. Description</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl text-text font-inter h-32 border border-gray-100 shadow-sm"
                            multiline
                            textAlignVertical="top"
                            placeholder={isManual ? "Describe the waste, visible items, and condition..." : "AI Summary..."}
                            value={analysisResult.summary_for_dashboard}
                            editable={true} // Always editable
                            onChangeText={(text) => setAnalysisResult({ ...analysisResult, summary_for_dashboard: text, authority_report: text })}
                        />
                    </View>

                    {/* 2. Waste Category Selection */}
                    <View className="mb-6">
                        <Text className="text-text font-bold font-inter mb-2">2. Waste Category</Text>
                        <View className="flex-row flex-wrap">
                            {['Household', 'Plastic', 'Construction', 'E-Waste', 'Medical', 'Hazardous', 'Organic', 'Mixed'].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setAnalysisResult({ ...analysisResult, waste_types_detected: [cat] })}
                                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${analysisResult.waste_types_detected?.[0] === cat ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`${analysisResult.waste_types_detected?.[0] === cat ? 'text-white' : 'text-textLight'} font-inter text-xs font-bold`}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 3. Severity & Urgency */}
                    <View className="mb-6 flex-row justify-between space-x-4">
                        <View className="flex-1">
                            <Text className="text-text font-bold font-inter mb-2">Severity</Text>
                            <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        onPress={() => setAnalysisResult({ ...analysisResult, severity_level: level })}
                                        className={`py-2 items-center ${analysisResult.severity_level === level ?
                                            (level === 'Critical' ? 'bg-red-500' : level === 'High' ? 'bg-orange-500' : 'bg-primary')
                                            : 'bg-white'}`}
                                    >
                                        <Text className={`font-bold text-xs ${analysisResult.severity_level === level ? 'text-white' : 'text-gray-400'}`}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 4. Urgency Flag */}
                        <View className="flex-1 ml-2">
                            <Text className="text-text font-bold font-inter mb-2">Urgency</Text>
                            <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {['Normal', 'Urgent', 'Emergency'].map((u) => (
                                    <TouchableOpacity
                                        key={u}
                                        onPress={() => setAnalysisResult({ ...analysisResult, urgency: u })}
                                        className={`py-2.5 items-center ${analysisResult.urgency === u ? 'bg-red-600' : 'bg-white'}`}
                                    >
                                        <Text className={`font-bold text-xs ${analysisResult.urgency === u ? 'text-white' : 'text-gray-400'}`}>{u}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>


                    {/* 5. Size & Duration */}
                    <View className="mb-6 flex-row justify-between">
                        <View className="flex-1 mr-2">
                            <Text className="text-text font-bold font-inter mb-2">Size Est.</Text>
                            <View className="bg-white rounded-xl border border-gray-100">
                                {['Small (Bag)', 'Medium (Pile)', 'Large (Dump)'].map((s) => (
                                    <TouchableOpacity key={s} onPress={() => setAnalysisResult({ ...analysisResult, size: s })} className={`p-2 ${analysisResult.size === s ? 'bg-gray-100' : ''}`}>
                                        <Text className="text-xs text-text">{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View className="flex-1 ml-2">
                            <Text className="text-text font-bold font-inter mb-2">Duration</Text>
                            <View className="bg-white rounded-xl border border-gray-100">
                                {['Just noticed', '1-2 Days', '> 1 Week'].map((d) => (
                                    <TouchableOpacity key={d} onPress={() => setAnalysisResult({ ...analysisResult, duration: d })} className={`p-2 ${analysisResult.duration === d ? 'bg-gray-100' : ''}`}>
                                        <Text className="text-xs text-text">{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* 6. Hazard Indicators (Checkboxes) */}
                    <View className="mb-6">
                        <Text className="text-text font-bold font-inter mb-2 flex-row items-center"><AlertTriangle size={16} color="#FF9800" /> Hazards Present</Text>
                        <View className="bg-white rounded-xl p-2 border border-gray-100">
                            {[
                                { key: 'sharp', label: 'Sharp Objects (Glass/Metal)' },
                                { key: 'toxic', label: 'Toxic / Chemical Leaks' },
                                { key: 'bio', label: 'Biomedical / Hospital Waste' },
                                { key: 'fire', label: 'Burned Material / Fire Risk' }
                            ].map((h) => (
                                <TouchableOpacity
                                    key={h.key}
                                    className="flex-row items-center justify-between p-3 border-b border-gray-50 last:border-0"
                                    onPress={() => {
                                        const hazards = analysisResult.hazards || {};
                                        setAnalysisResult({ ...analysisResult, hazards: { ...hazards, [h.key]: !hazards[h.key] } });
                                    }}
                                >
                                    <Text className="text-text text-sm font-inter">{h.label}</Text>
                                    <View className={`w-5 h-5 rounded border ${analysisResult.hazards?.[h.key] ? 'bg-red-500 border-red-500' : 'border-gray-300'} items-center justify-center`}>
                                        {analysisResult.hazards?.[h.key] && <Zap size={12} color="white" />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 7. Impact & Context */}
                    <View className="mb-8">
                        <Text className="text-text font-bold font-inter mb-2">Impact & Context</Text>
                        <View className="bg-white rounded-xl p-4 border border-gray-100">
                            {/* Smell Toggle */}
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <View className="bg-gray-100 p-1.5 rounded-full mr-3"><ThermometerSun size={16} color="#555" /></View>
                                    <Text className="text-text font-inter">Strong Odor / Smell</Text>
                                </View>
                                <Switch
                                    value={analysisResult.impact?.smell === 'Strong'}
                                    onValueChange={(v) => setAnalysisResult({ ...analysisResult, impact: { ...analysisResult.impact, smell: v ? 'Strong' : 'None' } })}
                                    trackColor={{ false: "#eee", true: "#FF9800" }}
                                />
                            </View>

                            {/* Water Toggle */}
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <View className="bg-blue-50 p-1.5 rounded-full mr-3"><Droplets size={16} color="#2196F3" /></View>
                                    <Text className="text-text font-inter">Near Water Body / Drain</Text>
                                </View>
                                <Switch
                                    value={analysisResult.impact?.water_near}
                                    onValueChange={(v) => setAnalysisResult({ ...analysisResult, impact: { ...analysisResult.impact, water_near: v } })}
                                    trackColor={{ false: "#eee", true: "#2196F3" }}
                                />
                            </View>

                            {/* Access Block */}
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <View className="bg-red-50 p-1.5 rounded-full mr-3"><User size={16} color="#F44336" /></View>
                                    <Text className="text-text font-inter">Blocking Access / Road</Text>
                                </View>
                                <Switch
                                    value={analysisResult.impact?.blocked_access}
                                    onValueChange={(v) => setAnalysisResult({ ...analysisResult, impact: { ...analysisResult.impact, blocked_access: v } })}
                                    trackColor={{ false: "#eee", true: "#F44336" }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Location Badge */}
                    <View className="flex-row items-center justify-center mb-8 bg-gray-50 py-2 rounded-lg">
                        <MapPin size={14} color="#757575" />
                        <Text className="text-xs text-textLight ml-2 font-inter">{address}</Text>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                        className="bg-primary p-4 rounded-xl items-center mb-4 shadow-md"
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-lg font-bold font-inter-bold">Confirm & Submit Report</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="p-4 items-center flex-row justify-center"
                        onPress={() => setStep(1)}
                        disabled={submitting}
                    >
                        <RefreshCw size={20} color="#757575" />
                        <Text className="text-textLight text-lg font-inter ml-2">Retake Photo</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        );
    }

    // --- STEP 1: CAMERA VIEW ---
    return (
        <View className="flex-1 bg-black relative">
            <CameraView
                style={{ flex: 1, ...StyleSheet.absoluteFillObject }}
                facing={facing}
                ref={cameraRef}
                mode="picture"
            />

            {/* Analyzing Overlay */}
            {analyzing && (
                <View className="absolute inset-0 bg-black/80 z-50 justify-center items-center px-6">
                    <View className="bg-white p-8 rounded-3xl w-full max-w-[340px] items-center shadow-2xl">
                        <View className="bg-green-50 p-6 rounded-full mb-6 relative">
                            <ActivityIndicator size="large" color="#2E7D32" />
                        </View>
                        <Text className="text-gray-900 text-xl font-bold font-inter-bold mb-3 text-center">Analyzing Scene</Text>
                        <Text className="text-gray-500 font-inter text-center leading-6">
                            AI is identifying waste types and assessing severity...
                        </Text>
                    </View>
                </View>
            )}

            <View className="absolute top-0 left-0 right-0 bottom-24 justify-center items-center pointer-events-none">
                <View className="bg-black/50 px-4 py-2 rounded-lg mb-8">
                    <Text className="text-white font-inter">Align waste within the frame</Text>
                </View>
                <View className="w-64 h-64 border-2 border-white rounded-2xl bg-transparent" />
            </View>

            {/* Controls */}
            <View className="absolute bottom-10 w-full flex-row justify-center items-center px-8">
                <TouchableOpacity
                    className="absolute left-8 bg-black/40 p-4 rounded-full flex-col items-center"
                    onPress={handleManualReport}
                    disabled={analyzing}
                    style={{ width: 80, height: 80, justifyContent: 'center' }}
                >
                    <View className="w-6 h-6 border-2 border-white rounded-md mb-1" />
                    <Text className="text-white text-[10px] font-inter font-bold">MANUAL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-24 h-24 rounded-full bg-white items-center justify-center shadow-lg border-4 border-gray-200"
                    onPress={handleCapture}
                    disabled={analyzing}
                >
                    <View className="w-20 h-20 rounded-full border-2 border-black bg-white" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="absolute right-10 bg-black/40 p-4 rounded-full"
                    onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
                    disabled={analyzing}
                >
                    <RefreshCw size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
