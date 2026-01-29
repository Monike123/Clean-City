import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, StyleSheet, TextInput, ScrollView, Dimensions, Modal, Pressable, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Leaf, RefreshCw, MapPin, ChevronDown, Check, Camera, X, Sparkles, AlertTriangle, Droplets, User, ThermometerSun, ImageIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GeminiService } from '../services/gemini';
import { ReportService } from '../services/reportService';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';
import { CacheService } from '../services/cacheService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Form Options
const WASTE_CATEGORIES = [
    { label: '🏠 Household Waste', value: 'Household' },
    { label: '♻️ Plastic Waste', value: 'Plastic' },
    { label: '🏗️ Construction Debris', value: 'Construction' },
    { label: '💻 E-Waste (Electronics)', value: 'E-Waste' },
    { label: '🏥 Medical Waste', value: 'Medical' },
    { label: '☠️ Hazardous Materials', value: 'Hazardous' },
    { label: '🌿 Organic/Food Waste', value: 'Organic' },
    { label: '📦 Mixed Waste', value: 'Mixed' },
];

const SEVERITY_LEVELS = [
    { label: '🟢 Low - Small scattered waste', value: 'Low', color: '#22C55E' },
    { label: '🟡 Medium - Noticeable pile', value: 'Medium', color: '#EAB308' },
    { label: '🟠 High - Large dump site', value: 'High', color: '#F97316' },
    { label: '🔴 Critical - Hazardous/Emergency', value: 'Critical', color: '#EF4444' },
];

const SIZE_OPTIONS = [
    { label: 'Small (Bag size)', value: 'Small' },
    { label: 'Medium (Pile)', value: 'Medium' },
    { label: 'Large (Dump site)', value: 'Large' },
    { label: 'Very Large (Needs truck)', value: 'Very Large' },
];

const DURATION_OPTIONS = [
    { label: 'Just noticed', value: 'Just noticed' },
    { label: '1-2 Days', value: '1-2 Days' },
    { label: '3-7 Days', value: '1 Week' },
    { label: 'More than a week', value: '> 1 Week' },
];

const URGENCY_OPTIONS = [
    { label: '⏳ Normal - Can wait', value: 'Normal', color: '#6B7280' },
    { label: '⚡ Urgent - Within 24h', value: 'Urgent', color: '#F97316' },
    { label: '🚨 Emergency - Immediate', value: 'Emergency', color: '#EF4444' },
];

// Dropdown Component
function FormDropdown({
    label,
    value,
    options,
    onChange,
    required = true,
    questionNumber
}: {
    label: string;
    value: string;
    options: { label: string; value: string; color?: string }[];
    onChange: (v: string) => void;
    required?: boolean;
    questionNumber: number;
}) {
    const [visible, setVisible] = useState(false);
    const selected = options.find(o => o.value === value);

    return (
        <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>{questionNumber}</Text>
                <Text style={styles.questionLabel}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.dropdown, !value && styles.dropdownEmpty]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
                    {selected?.label || 'Select an option...'}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.option, value === option.value && styles.optionSelected]}
                                    onPress={() => { onChange(option.value); setVisible(false); }}
                                >
                                    <Text style={[styles.optionText, value === option.value && styles.optionTextSelected]}>
                                        {option.label}
                                    </Text>
                                    {value === option.value && <Check size={20} color="#2E7D32" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

export default function ReportCameraScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const mode = params.mode as 'ai' | 'manual';

    const [step, setStep] = useState<1 | 2>(1);
    const [capturing, setCapturing] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [aiAnalyzed, setAiAnalyzed] = useState(false);

    // Form state
    const [description, setDescription] = useState('');
    const [wasteCategory, setWasteCategory] = useState('');
    const [severity, setSeverity] = useState('');
    const [size, setSize] = useState('');
    const [duration, setDuration] = useState('');
    const [urgency, setUrgency] = useState('Normal');

    // Hazards
    const [hasSharpObjects, setHasSharpObjects] = useState(false);
    const [hasToxicChemical, setHasToxicChemical] = useState(false);
    const [hasBiomedical, setHasBiomedical] = useState(false);
    const [hasFireRisk, setHasFireRisk] = useState(false);
    const [noHazards, setNoHazards] = useState(false);

    // Impact
    const [hasStrongOdor, setHasStrongOdor] = useState(false);
    const [nearWater, setNearWater] = useState(false);
    const [blockingAccess, setBlockingAccess] = useState(false);
    const [animalHazard, setAnimalHazard] = useState(false);

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

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            try {
                let reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                });

                if (reverseGeocode.length > 0) {
                    const addr = reverseGeocode[0];
                    setAddress(`${addr.name || ''} ${addr.street || ''}, ${addr.city}`);
                }
            } catch (e) {
                setAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
            }
        })();
    }, []);

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <Camera size={60} color="#2E7D32" />
                <Text style={styles.permissionText}>Camera access needed to capture waste photos</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Capture photo and go to form (NO AI at this stage)
    const handleCapture = async () => {
        if (!cameraRef.current) return;
        setCapturing(true);

        try {
            // Lower quality = smaller image = faster upload and less storage
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.3, // Reduced for ~200-400KB images instead of 5MB+
                skipProcessing: true,
            });

            if (photo?.base64) {
                const sizeKB = Math.round((photo.base64.length * 0.75) / 1024);
                console.log(`[Camera] Captured image: ${sizeKB}KB`);
                setCapturedImage(photo.base64);
                setStep(2); // Go to form immediately
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        } finally {
            setCapturing(false);
        }
    };

    // Pick image from gallery
    const handlePickFromGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Gallery access is needed to select photos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.3,
                base64: true,
            });

            if (!result.canceled && result.assets[0]?.base64) {
                const sizeKB = Math.round((result.assets[0].base64.length * 0.75) / 1024);
                console.log(`[Gallery] Selected image: ${sizeKB}KB`);
                setCapturedImage(result.assets[0].base64);
                setStep(2);
            }
        } catch (e: any) {
            console.error('[Gallery] Error:', e);
            Alert.alert('Error', 'Failed to select image from gallery');
        }
    };

    // AI Analysis - Called when user clicks "AI Analyze" button on form
    const handleAIAnalysis = async () => {
        if (!capturedImage) return;
        setAnalyzing(true);

        try {
            console.log('[AI] Starting analysis...');
            const result = await GeminiService.analyzeImage(capturedImage);
            console.log('[AI] Analysis complete:', result);

            // Fill form with AI results
            if (result.summary_for_dashboard) setDescription(result.summary_for_dashboard);

            // Map waste types detected to our categories
            if (result.waste_types_detected?.[0]) {
                const detected = result.waste_types_detected[0].toLowerCase();
                // Map common AI responses to our category values
                if (detected.includes('plastic')) {
                    setWasteCategory('Plastic');
                } else if (detected.includes('household') || detected.includes('domestic')) {
                    setWasteCategory('Household');
                } else if (detected.includes('construction') || detected.includes('rubble') || detected.includes('debris')) {
                    setWasteCategory('Construction');
                } else if (detected.includes('e-waste') || detected.includes('electronic')) {
                    setWasteCategory('E-Waste');
                } else if (detected.includes('medical') || detected.includes('hospital')) {
                    setWasteCategory('Medical');
                } else if (detected.includes('hazardous') || detected.includes('chemical') || detected.includes('toxic')) {
                    setWasteCategory('Hazardous');
                } else if (detected.includes('organic') || detected.includes('food') || detected.includes('green')) {
                    setWasteCategory('Organic');
                } else {
                    setWasteCategory('Mixed');
                }
            }
            if (result.size_estimation) {
                // Map AI size to our options
                const sizeMap: Record<string, string> = {
                    'small': 'Small',
                    'medium': 'Medium',
                    'large': 'Large',
                    'very large': 'Very Large'
                };
                const normalized = result.size_estimation.toLowerCase();
                for (const [key, val] of Object.entries(sizeMap)) {
                    if (normalized.includes(key)) {
                        setSize(val);
                        break;
                    }
                }
            }
            if (result.urgency_level) setUrgency(result.urgency_level);

            // Hazards
            if (result.hazard_indicators?.length) {
                const hazards = result.hazard_indicators.map(h => h.toLowerCase());
                if (hazards.some(h => h.includes('sharp'))) setHasSharpObjects(true);
                if (hazards.some(h => h.includes('toxic') || h.includes('chemical'))) setHasToxicChemical(true);
                if (hazards.some(h => h.includes('bio') || h.includes('medical'))) setHasBiomedical(true);
                if (hazards.some(h => h.includes('fire'))) setHasFireRisk(true);
            }

            // Impact
            if (result.animal_hazard) setAnimalHazard(true);
            if (result.water_impact_details) setNearWater(true);
            if (result.accessibility_block?.length) setBlockingAccess(true);

            setAiAnalyzed(true);
            Alert.alert('✅ AI Analysis Complete', 'Form fields have been filled. Please review and adjust if needed.');

        } catch (e: any) {
            console.error('[AI] Analysis error:', e);
            Alert.alert('AI Analysis Failed', 'Could not analyze image. Please fill the form manually.');
        } finally {
            setAnalyzing(false);
        }
    };

    const validateForm = () => {
        if (!wasteCategory) {
            Alert.alert('Required', 'Please select a waste category');
            return false;
        }
        if (!severity) {
            Alert.alert('Required', 'Please select severity level');
            return false;
        }
        if (!size) {
            Alert.alert('Required', 'Please select estimated size');
            return false;
        }
        if (!description || description.length < 10) {
            Alert.alert('Required', 'Please provide a description (at least 10 characters)');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;
        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const userId = user?.id || 'anon_user';
            const imageDataUri = await ReportService.uploadImage(capturedImage, userId);

            if (!imageDataUri) throw new Error("Image processing failed");

            const reportData = {
                user_id: userId,
                media_file: imageDataUri,
                media_type: 'image',
                location: {
                    latitude: location?.coords.latitude || 0,
                    longitude: location?.coords.longitude || 0,
                    address: address
                },
                waste_category: wasteCategory,
                ai_confidence_score: aiAnalyzed ? 0.8 : 1.0,
                description: description,
                status: 'submitted',
                severity: severity.toLowerCase(),
                urgency_level: urgency,
                size_estimation: size,
                duration_presence: duration,
                hazard_indicators: {
                    sharp: hasSharpObjects,
                    toxic: hasToxicChemical,
                    biomedical: hasBiomedical,
                    fire: hasFireRisk
                },
                impact_details: {
                    smell: hasStrongOdor ? 'Strong' : 'None',
                    water_near: nearWater,
                    blocked_access: blockingAccess
                },
                animal_hazard: animalHazard,
                water_impact_details: nearWater ? 'Near water body/drain' : null,
                location_context: address,
                recurring_status: false,
                metadata: {
                    mode: mode,
                    ai_analyzed: aiAnalyzed
                }
            };

            await ReportService.createReport(reportData);

            await CacheService.remove('map_all_reports');
            await CacheService.remove('user_reports');
            await CacheService.remove('all_reports');

            Alert.alert('✅ Report Submitted!', 'Thank you for helping keep our city clean! +100 EcoPoints earned!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (e) {
            Alert.alert("Error", "Could not save your report. Please try again.");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    // STEP 2: FORM
    if (step === 2) {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.formContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.formHeader}>
                            <Leaf size={32} color="#2E7D32" />
                            <Text style={styles.formTitle}>Waste Report</Text>
                            <Text style={styles.formSubtitle}>
                                {mode === 'ai' ? 'Use AI to auto-fill or fill manually' : 'Fill in the details below'}
                            </Text>
                        </View>

                        {/* Image Preview */}
                        {capturedImage && (
                            <View style={styles.imagePreviewCard}>
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${capturedImage}` }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity style={styles.retakeButton} onPress={() => setStep(1)}>
                                    <RefreshCw size={16} color="#FFF" />
                                    <Text style={styles.retakeText}>Retake</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* AI Analysis Button - Only in AI mode */}
                        {mode === 'ai' && (
                            <TouchableOpacity
                                style={[styles.aiButton, analyzing && styles.aiButtonDisabled, aiAnalyzed && styles.aiButtonDone]}
                                onPress={handleAIAnalysis}
                                disabled={analyzing || aiAnalyzed}
                                activeOpacity={0.8}
                            >
                                {analyzing ? (
                                    <>
                                        <ActivityIndicator color="white" size="small" />
                                        <Text style={styles.aiButtonText}>Analyzing...</Text>
                                    </>
                                ) : aiAnalyzed ? (
                                    <>
                                        <Check size={20} color="white" />
                                        <Text style={styles.aiButtonText}>AI Analysis Complete</Text>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} color="white" />
                                        <Text style={styles.aiButtonText}>🤖 Auto-Fill with AI</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Question 1: Description */}
                        <View style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>1</Text>
                                <Text style={styles.questionLabel}>
                                    Description <Text style={styles.required}>*</Text>
                                </Text>
                            </View>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                placeholder="Describe what you see..."
                                placeholderTextColor="#9CA3AF"
                                value={description}
                                onChangeText={setDescription}
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{description.length}/500</Text>
                        </View>

                        {/* Question 2: Waste Category */}
                        <FormDropdown
                            questionNumber={2}
                            label="Waste Category"
                            value={wasteCategory}
                            options={WASTE_CATEGORIES}
                            onChange={setWasteCategory}
                            required
                        />

                        {/* Question 3: Severity */}
                        <FormDropdown
                            questionNumber={3}
                            label="Severity Level"
                            value={severity}
                            options={SEVERITY_LEVELS}
                            onChange={setSeverity}
                            required
                        />

                        {/* Question 4: Size */}
                        <FormDropdown
                            questionNumber={4}
                            label="Estimated Size"
                            value={size}
                            options={SIZE_OPTIONS}
                            onChange={setSize}
                            required
                        />

                        {/* Question 5: Duration */}
                        <FormDropdown
                            questionNumber={5}
                            label="How long has it been here?"
                            value={duration}
                            options={DURATION_OPTIONS}
                            onChange={setDuration}
                            required={false}
                        />

                        {/* Question 6: Urgency */}
                        <FormDropdown
                            questionNumber={6}
                            label="Urgency Level"
                            value={urgency}
                            options={URGENCY_OPTIONS}
                            onChange={setUrgency}
                            required={false}
                        />

                        {/* Question 7: Hazards */}
                        <View style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>7</Text>
                                <Text style={styles.questionLabel}>Hazards Present</Text>
                            </View>
                            <View style={styles.hazardGrid}>
                                <TouchableOpacity
                                    style={[styles.hazardItem, noHazards && styles.hazardItemNone]}
                                    onPress={() => {
                                        setNoHazards(!noHazards);
                                        if (!noHazards) {
                                            setHasSharpObjects(false);
                                            setHasToxicChemical(false);
                                            setHasBiomedical(false);
                                            setHasFireRisk(false);
                                        }
                                    }}
                                >
                                    <Check size={18} color={noHazards ? '#22C55E' : '#9CA3AF'} />
                                    <Text style={[styles.hazardText, noHazards && styles.hazardTextNone]}>None</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.hazardItem, hasSharpObjects && styles.hazardItemActive]}
                                    onPress={() => { setHasSharpObjects(!hasSharpObjects); setNoHazards(false); }}
                                >
                                    <AlertTriangle size={18} color={hasSharpObjects ? '#EF4444' : '#9CA3AF'} />
                                    <Text style={[styles.hazardText, hasSharpObjects && styles.hazardTextActive]}>Sharp Objects</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.hazardItem, hasToxicChemical && styles.hazardItemActive]}
                                    onPress={() => { setHasToxicChemical(!hasToxicChemical); setNoHazards(false); }}
                                >
                                    <AlertTriangle size={18} color={hasToxicChemical ? '#EF4444' : '#9CA3AF'} />
                                    <Text style={[styles.hazardText, hasToxicChemical && styles.hazardTextActive]}>Toxic/Chemical</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.hazardItem, hasBiomedical && styles.hazardItemActive]}
                                    onPress={() => { setHasBiomedical(!hasBiomedical); setNoHazards(false); }}
                                >
                                    <AlertTriangle size={18} color={hasBiomedical ? '#EF4444' : '#9CA3AF'} />
                                    <Text style={[styles.hazardText, hasBiomedical && styles.hazardTextActive]}>Biomedical</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.hazardItem, hasFireRisk && styles.hazardItemActive]}
                                    onPress={() => { setHasFireRisk(!hasFireRisk); setNoHazards(false); }}
                                >
                                    <AlertTriangle size={18} color={hasFireRisk ? '#EF4444' : '#9CA3AF'} />
                                    <Text style={[styles.hazardText, hasFireRisk && styles.hazardTextActive]}>Fire Risk</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Question 8: Impact */}
                        <View style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>8</Text>
                                <Text style={styles.questionLabel}>Environmental Impact</Text>
                            </View>

                            <View style={styles.impactRow}>
                                <View style={styles.impactLabel}>
                                    <ThermometerSun size={18} color="#6B7280" />
                                    <Text style={styles.impactText}>Strong Odor</Text>
                                </View>
                                <Switch value={hasStrongOdor} onValueChange={setHasStrongOdor} trackColor={{ true: '#2E7D32' }} />
                            </View>

                            <View style={styles.impactRow}>
                                <View style={styles.impactLabel}>
                                    <Droplets size={18} color="#3B82F6" />
                                    <Text style={styles.impactText}>Near Water Body</Text>
                                </View>
                                <Switch value={nearWater} onValueChange={setNearWater} trackColor={{ true: '#2E7D32' }} />
                            </View>

                            <View style={styles.impactRow}>
                                <View style={styles.impactLabel}>
                                    <User size={18} color="#EF4444" />
                                    <Text style={styles.impactText}>Blocking Access</Text>
                                </View>
                                <Switch value={blockingAccess} onValueChange={setBlockingAccess} trackColor={{ true: '#2E7D32' }} />
                            </View>

                            <View style={[styles.impactRow, { borderBottomWidth: 0 }]}>
                                <View style={styles.impactLabel}>
                                    <AlertTriangle size={18} color="#F97316" />
                                    <Text style={styles.impactText}>Animal Hazard</Text>
                                </View>
                                <Switch value={animalHazard} onValueChange={setAnimalHazard} trackColor={{ true: '#2E7D32' }} />
                            </View>
                        </View>

                        {/* Location */}
                        <View style={styles.locationCard}>
                            <MapPin size={16} color="#6B7280" />
                            <Text style={styles.locationText}>{address}</Text>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Report</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // STEP 1: CAMERA
    return (
        <View style={styles.cameraContainer}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                ref={cameraRef}
                mode="picture"
            />

            {capturing && (
                <View style={styles.analyzingOverlay}>
                    <View style={styles.analyzingBox}>
                        <ActivityIndicator size="large" color="#2E7D32" />
                        <Text style={styles.analyzingText}>Capturing...</Text>
                    </View>
                </View>
            )}

            <View style={styles.cameraOverlay}>
                <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{mode === 'ai' ? '🤖 AI Mode' : '📝 Manual Mode'}</Text>
                </View>
                <View style={styles.frameBorder} />
            </View>

            <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={handlePickFromGallery}
                >
                    <ImageIcon size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleCapture}
                    disabled={capturing}
                >
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.flipButton}
                    onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
                >
                    <RefreshCw size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 40,
    },
    permissionText: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    formContent: {
        padding: 16,
        paddingBottom: 100,
    },
    formHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 8,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    imagePreviewCard: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: 180,
    },
    retakeButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    retakeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    aiButton: {
        backgroundColor: '#7C3AED',
        paddingVertical: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    aiButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    aiButtonDone: {
        backgroundColor: '#22C55E',
    },
    aiButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2E7D32',
        color: 'white',
        textAlign: 'center',
        lineHeight: 28,
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 10,
    },
    questionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    required: {
        color: '#EF4444',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
    },
    dropdownEmpty: {
        borderColor: '#D1D5DB',
    },
    dropdownText: {
        fontSize: 15,
        color: '#1F2937',
    },
    dropdownPlaceholder: {
        color: '#9CA3AF',
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 100,
    },
    charCount: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    hazardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hazardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    hazardItemActive: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    hazardItemNone: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
    },
    hazardText: {
        fontSize: 13,
        color: '#6B7280',
    },
    hazardTextActive: {
        color: '#EF4444',
        fontWeight: '600',
    },
    hazardTextNone: {
        color: '#22C55E',
        fontWeight: '600',
    },
    impactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    impactLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    impactText: {
        fontSize: 14,
        color: '#374151',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    optionsList: {
        padding: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        marginVertical: 2,
    },
    optionSelected: {
        backgroundColor: '#E8F5E9',
    },
    optionText: {
        fontSize: 15,
        color: '#374151',
    },
    optionTextSelected: {
        color: '#2E7D32',
        fontWeight: '600',
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    locationText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    analyzingBox: {
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
    },
    analyzingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 12,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        bottom: 100,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    modeBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    modeBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    frameBorder: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 16,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    backButton: {
        position: 'absolute',
        left: 32,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#E5E7EB',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#1F2937',
    },
    galleryButton: {
        position: 'absolute',
        left: 100,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 14,
        borderRadius: 30,
    },
    flipButton: {
        position: 'absolute',
        right: 32,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 14,
        borderRadius: 30,
    },
});
