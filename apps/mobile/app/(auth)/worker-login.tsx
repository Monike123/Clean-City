import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Eye, EyeOff, ArrowLeft, Briefcase, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { UserRole, WorkerProfile } from '../../types';

type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export default function WorkerLoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();

    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const handleWorkerLogin = async () => {
        if (!employeeId || !password) {
            Alert.alert('Error', 'Please enter both Employee ID and password');
            return;
        }

        setLoading(true);
        setVerificationStatus(null);
        setRejectionReason(null);

        try {
            // First, find the worker by employee ID
            const { data: workerData, error: workerError } = await supabase
                .from('workers')
                .select('*')
                .eq('employee_id', employeeId.toUpperCase())
                .single();

            if (workerError || !workerData) {
                Alert.alert('Error', 'Worker not found. Please check your Employee ID or register first.');
                setLoading(false);
                return;
            }

            // Check verification status
            if (workerData.verification_status !== 'approved') {
                setVerificationStatus(workerData.verification_status);
                if (workerData.verification_status === 'rejected') {
                    setRejectionReason(workerData.rejection_reason);
                }
                setLoading(false);
                return;
            }

            // If approved, try to login with Supabase auth using email
            if (!workerData.email) {
                Alert.alert('Error', 'No email associated with this worker account. Contact your administrator.');
                setLoading(false);
                return;
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: workerData.email,
                password,
            });

            if (authError) {
                Alert.alert('Login Failed', 'Invalid credentials. Please check your password.');
                setLoading(false);
                return;
            }

            if (authData.user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                // Update last active
                await supabase
                    .from('workers')
                    .update({ last_active_at: new Date().toISOString(), is_available: true })
                    .eq('id', workerData.id);

                login({
                    id: authData.user.id,
                    email: authData.user.email || '',
                    full_name: workerData.full_name || profile?.full_name || 'Worker',
                    role: UserRole.WORKER,
                    eco_points: profile?.eco_points || 0,
                    created_at: authData.user.created_at
                }, authData.session?.access_token || '');

                // Navigate to worker dashboard
                router.replace('/(worker)/dashboard');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const renderVerificationStatus = () => {
        if (!verificationStatus) return null;

        const statusConfig = {
            pending: {
                icon: <Clock size={48} color="#F59E0B" />,
                title: 'Verification Pending',
                message: 'Your worker account is awaiting verification by the authority. You will be notified once approved.',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
            },
            rejected: {
                icon: <AlertCircle size={48} color="#EF4444" />,
                title: 'Verification Rejected',
                message: rejectionReason || 'Your worker account verification was rejected. Please contact your administrator.',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
            },
            suspended: {
                icon: <AlertCircle size={48} color="#EF4444" />,
                title: 'Account Suspended',
                message: 'Your worker account has been suspended. Please contact your administrator for assistance.',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
            },
        };

        const config = statusConfig[verificationStatus as keyof typeof statusConfig];
        if (!config) return null;

        return (
            <View className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-6 mt-6`}>
                <View className="items-center mb-4">
                    {config.icon}
                </View>
                <Text className="text-lg font-inter-bold text-center text-text mb-2">{config.title}</Text>
                <Text className="text-sm text-textLight text-center font-inter">{config.message}</Text>

                {verificationStatus === 'rejected' && (
                    <TouchableOpacity
                        className="bg-primary py-3 rounded-xl items-center mt-4"
                        onPress={() => router.push('/(auth)/worker-register')}
                    >
                        <Text className="text-white font-inter-bold">Submit New Application</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        className="flex-row items-center mb-6"
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color="#22C55E" />
                        <Text className="text-primary font-inter-medium ml-2">Back</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="items-center mb-8">
                        <View className="bg-secondary/10 p-4 rounded-full mb-4">
                            <Briefcase size={40} color="#3B82F6" />
                        </View>
                        <Text className="text-2xl font-inter-bold text-text mb-2">Worker Login</Text>
                        <Text className="text-base text-textLight text-center font-inter">
                            Sign in with your Employee ID and password
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View className="space-y-4">
                        <View>
                            <Text className="text-text font-inter-medium mb-2 ml-1">Employee ID</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                placeholder="e.g., EMP-2024-001"
                                placeholderTextColor="#9CA3AF"
                                value={employeeId}
                                onChangeText={setEmployeeId}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View>
                            <Text className="text-text font-inter-medium mb-2 ml-1">Password</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
                                <TextInput
                                    className="flex-1 py-4 font-inter text-text"
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    {isPasswordVisible ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`bg-secondary py-4 rounded-xl items-center mt-6 shadow-sm ${loading ? 'opacity-70' : ''}`}
                            onPress={handleWorkerLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-inter-bold">Sign In as Worker</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Verification Status Display */}
                    {renderVerificationStatus()}

                    {/* Register Link */}
                    <View className="mt-8">
                        <TouchableOpacity onPress={() => router.push('/(auth)/worker-register')}>
                            <Text className="text-textLight text-center font-inter">
                                New worker? <Text className="text-secondary font-inter-bold">Register here</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
