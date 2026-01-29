import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Check, X } from 'lucide-react-native';

export default function SignupScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        number: false,
        special: false
    });

    const checkStrength = (pass: string) => {
        setPasswordStrength({
            length: pass.length >= 8,
            number: /\d/.test(pass),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
        });
        setPassword(pass);
    };

    const handleSignup = async () => {
        if (!email || !password || !fullName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // we use REAL auth because 'profiles' table requires a valid User ID (Foreign Key)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'http://localhost:3000' // Ensure this is whitelisted in Supabase Dashboard > Auth > URL Configuration
                }
            });

            if (error) throw error;

            if (data.session) {
                // SUCCESS: Verification disabled or implicit
                // 1. Create Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user!.id,
                            email: email,
                            full_name: fullName,
                            role: 'citizen',
                            eco_points: 0
                        }
                    ]);

                if (profileError) {
                    console.error('Profile creation failed:', profileError.message);
                    // Continue anyway to let them into the app, profile can be fixed/created later or by triggers
                }

                // 2. Login Locally
                login({
                    id: data.user!.id,
                    email: email,
                    full_name: fullName,
                    role: UserRole.CITIZEN,
                    eco_points: 0,
                    created_at: new Date().toISOString()
                }, data.session.access_token);

                // Seamless transition
                router.replace('/(tabs)/home');

            } else if (data.user) {
                // Fallback: If for some reason verification is still ON in backend
                Alert.alert(
                    'Verification Required',
                    'Please check your email to verify your account.'
                );
                router.replace('/(auth)/login');
            }
        } catch (e: any) {
            Alert.alert('Signup Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    // Note: React Native's TextInput uses 'secureTextEntry'

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
                    <View className="mb-8">
                        <Text className="text-3xl font-inter-bold text-primary text-center">Create Account</Text>
                        <Text className="text-textLight text-center font-inter mt-2">Join the waste-free revolution</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-text font-inter-medium mb-2 ml-1">Full Name</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                placeholder="John Doe"
                                placeholderTextColor="#9CA3AF"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                        <View>
                            <Text className="text-text font-inter-medium mb-2 ml-1">Email</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                placeholder="john@example.com"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                        <View>
                            <Text className="text-text font-inter-medium mb-2 ml-1">Password</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 font-inter text-text">
                                <TextInput
                                    className="flex-1 py-4 font-inter text-text"
                                    placeholder="Min 8 chars, 1 number, 1 special"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={checkStrength}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    {isPasswordVisible ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                </TouchableOpacity>
                            </View>

                            {/* Strength Indicators */}
                            <View className="flex-row flex-wrap mt-2 gap-2">
                                <View className="flex-row items-center space-x-1">
                                    {passwordStrength.length ? <Check size={12} color="green" /> : <X size={12} color="gray" />}
                                    <Text className={`text-xs ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>8+ Chars</Text>
                                </View>
                                <View className="flex-row items-center space-x-1 ml-3">
                                    {passwordStrength.number ? <Check size={12} color="green" /> : <X size={12} color="gray" />}
                                    <Text className={`text-xs ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>Number</Text>
                                </View>
                                <View className="flex-row items-center space-x-1 ml-3">
                                    {passwordStrength.special ? <Check size={12} color="green" /> : <X size={12} color="gray" />}
                                    <Text className={`text-xs ${passwordStrength.special ? 'text-green-600' : 'text-gray-400'}`}>Special Char</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`bg-primary py-4 rounded-xl items-center mt-6 shadow-sm ${loading ? 'opacity-70' : ''}`}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-inter-bold">Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-textLight text-center font-inter mt-4 mb-8">
                                Already have an account? <Text className="text-secondary font-inter-bold">Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
