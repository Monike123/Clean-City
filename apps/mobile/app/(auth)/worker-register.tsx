import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Camera, Upload, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

type Department = 'sanitation' | 'waste_management' | 'environment' | 'maintenance';
type IdProofType = 'aadhar' | 'pan' | 'voter_id' | 'driving_license';
type EmploymentType = 'permanent' | 'contract' | 'temporary';

export default function WorkerRegisterScreen() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form data
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [wardNumber, setWardNumber] = useState('');
    const [department, setDepartment] = useState<Department>('sanitation');
    const [idProofType, setIdProofType] = useState<IdProofType>('aadhar');
    const [idProofNumber, setIdProofNumber] = useState('');
    const [employmentType, setEmploymentType] = useState<EmploymentType>('permanent');
    const [idProofImage, setIdProofImage] = useState<string | null>(null);

    const departments: { value: Department; label: string }[] = [
        { value: 'sanitation', label: 'Sanitation' },
        { value: 'waste_management', label: 'Waste Management' },
        { value: 'environment', label: 'Environment' },
        { value: 'maintenance', label: 'Maintenance' },
    ];

    const idProofTypes: { value: IdProofType; label: string }[] = [
        { value: 'aadhar', label: 'Aadhar Card' },
        { value: 'pan', label: 'PAN Card' },
        { value: 'voter_id', label: 'Voter ID' },
        { value: 'driving_license', label: 'Driving License' },
    ];

    const employmentTypes: { value: EmploymentType; label: string }[] = [
        { value: 'permanent', label: 'Permanent' },
        { value: 'contract', label: 'Contract' },
        { value: 'temporary', label: 'Temporary' },
    ];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setIdProofImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const generateEmployeeId = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `EMP-${year}-${random}`;
    };

    const handleSubmit = async () => {
        // Validation
        if (!fullName || !phoneNumber || !email || !password || !wardNumber || !idProofNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!idProofImage) {
            Alert.alert('Error', 'Please upload your ID proof image');
            return;
        }

        setLoading(true);

        try {
            // 1. Create Supabase auth account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (!authData.user) {
                Alert.alert('Error', 'Failed to create account');
                setLoading(false);
                return;
            }

            // 2. Create profile entry
            await supabase.from('profiles').insert({
                id: authData.user.id,
                email,
                full_name: fullName,
                role: 'worker',
            });

            // 3. Create worker entry (pending verification)
            const employeeId = generateEmployeeId();

            const { error: workerError } = await supabase.from('workers').insert({
                user_id: authData.user.id,
                full_name: fullName,
                phone_number: phoneNumber,
                email,
                employee_id: employeeId,
                ward_number: wardNumber,
                department,
                id_proof_type: idProofType,
                id_proof_number: idProofNumber,
                id_proof_image_url: idProofImage,
                employment_type: employmentType,
                verification_status: 'pending',
                is_active: false,
            });

            if (workerError) throw workerError;

            // Success
            setSubmitted(true);

        } catch (e: any) {
            console.error('Worker registration error:', e);
            Alert.alert('Registration Failed', e.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="flex-1 justify-center items-center px-8">
                    <View className="bg-green-100 p-6 rounded-full mb-6">
                        <CheckCircle size={64} color="#22C55E" />
                    </View>
                    <Text className="text-2xl font-inter-bold text-text text-center mb-4">
                        Registration Submitted!
                    </Text>
                    <Text className="text-base text-textLight text-center font-inter mb-8">
                        Your worker registration has been submitted for verification.
                        You will receive a notification once the authority approves your application.
                    </Text>
                    <TouchableOpacity
                        className="bg-primary py-4 px-8 rounded-xl"
                        onPress={() => router.replace('/(auth)/worker-login')}
                    >
                        <Text className="text-white font-inter-bold">Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        className="flex-row items-center mb-6"
                        onPress={() => step > 1 ? setStep(step - 1) : router.back()}
                    >
                        <ArrowLeft size={24} color="#22C55E" />
                        <Text className="text-primary font-inter-medium ml-2">
                            {step > 1 ? 'Previous' : 'Back'}
                        </Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-2xl font-inter-bold text-text mb-2">Worker Registration</Text>
                        <Text className="text-base text-textLight font-inter">
                            Step {step} of 3 - {step === 1 ? 'Personal Info' : step === 2 ? 'Employment Details' : 'ID Verification'}
                        </Text>
                        {/* Progress bar */}
                        <View className="flex-row mt-4 space-x-2">
                            {[1, 2, 3].map((s) => (
                                <View
                                    key={s}
                                    className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <View className="space-y-4">
                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Full Name *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Phone Number *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                    placeholder="+91 98765 43210"
                                    placeholderTextColor="#9CA3AF"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Email *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                    placeholder="worker@example.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Password *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                    placeholder="Create a password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                            <TouchableOpacity
                                className="bg-primary py-4 rounded-xl items-center mt-4"
                                onPress={() => setStep(2)}
                            >
                                <Text className="text-white font-inter-bold">Continue</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 2: Employment Details */}
                    {step === 2 && (
                        <View className="space-y-4">
                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Ward Number *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                    placeholder="e.g., 12"
                                    placeholderTextColor="#9CA3AF"
                                    value={wardNumber}
                                    onChangeText={setWardNumber}
                                />
                            </View>

                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Department *</Text>
                                <View className="flex-row flex-wrap">
                                    {departments.map((dept) => (
                                        <TouchableOpacity
                                            key={dept.value}
                                            className={`mr-2 mb-2 px-4 py-3 rounded-xl border-2 ${department === dept.value ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'}`}
                                            onPress={() => setDepartment(dept.value)}
                                        >
                                            <Text className={department === dept.value ? 'text-primary font-inter-bold' : 'text-text font-inter'}>
                                                {dept.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Employment Type *</Text>
                                <View className="flex-row flex-wrap">
                                    {employmentTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            className={`mr-2 mb-2 px-4 py-3 rounded-xl border-2 ${employmentType === type.value ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'}`}
                                            onPress={() => setEmploymentType(type.value)}
                                        >
                                            <Text className={employmentType === type.value ? 'text-primary font-inter-bold' : 'text-text font-inter'}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                className="bg-primary py-4 rounded-xl items-center mt-4"
                                onPress={() => setStep(3)}
                            >
                                <Text className="text-white font-inter-bold">Continue</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 3: ID Verification */}
                    {step === 3 && (
                        <View className="space-y-4">
                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">ID Proof Type *</Text>
                                <View className="flex-row flex-wrap">
                                    {idProofTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            className={`mr-2 mb-2 px-4 py-3 rounded-xl border-2 ${idProofType === type.value ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'}`}
                                            onPress={() => setIdProofType(type.value)}
                                        >
                                            <Text className={idProofType === type.value ? 'text-primary font-inter-bold' : 'text-text font-inter'}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">ID Proof Number *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                    placeholder={idProofType === 'aadhar' ? 'XXXX-XXXX-XXXX' : 'Enter ID number'}
                                    placeholderTextColor="#9CA3AF"
                                    value={idProofNumber}
                                    onChangeText={setIdProofNumber}
                                />
                            </View>

                            <View>
                                <Text className="text-text font-inter-medium mb-2 ml-1">Upload ID Proof Image *</Text>
                                <TouchableOpacity
                                    className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 items-center"
                                    onPress={pickImage}
                                >
                                    {idProofImage ? (
                                        <View className="items-center">
                                            <Image
                                                source={{ uri: idProofImage }}
                                                className="w-48 h-36 rounded-lg mb-2"
                                                resizeMode="cover"
                                            />
                                            <Text className="text-primary font-inter-medium">Tap to change</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <Upload size={40} color="#9CA3AF" />
                                            <Text className="text-textLight font-inter mt-2">Tap to upload ID proof</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className={`bg-primary py-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-inter-bold">Submit Registration</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
