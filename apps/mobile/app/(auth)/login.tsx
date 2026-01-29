import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Fetch user profile from 'profiles' table if it exists
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                login({
                    id: data.user.id,
                    email: data.user.email || '',
                    full_name: profile?.full_name || 'Eco Warrior',
                    role: profile?.role || UserRole.CITIZEN,
                    eco_points: profile?.eco_points || 0,
                    created_at: data.user.created_at
                }, data.session?.access_token || '');

                // Route based on user role
                if (profile?.role === 'worker') {
                    router.replace('/(worker)/dashboard');
                } else {
                    router.replace('/(tabs)/home');
                }
            }
        } catch (e: any) {
            Alert.alert('Login Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
                    <View className="mb-10">
                        <Text className="text-4xl font-inter-bold text-primary text-center mb-2">Clear City</Text>
                        <Text className="text-base text-textLight text-center font-inter">Sign in to start your impact</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-text font-inter-medium mb-2 ml-1">Email</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 font-inter text-text"
                                placeholder="Enter your email"
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
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    {isPasswordVisible ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`bg-primary py-4 rounded-xl items-center mt-6 shadow-sm ${loading ? 'opacity-70' : ''}`}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-inter-bold">Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} className="mt-4">
                            <Text className="text-textLight text-center font-inter">
                                Don't have an account? <Text className="text-secondary font-inter-bold">Sign Up</Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={async () => {
                            if (!email) {
                                Alert.alert('Required', 'Please enter your email address to resend confirmation.');
                                return;
                            }
                            if (loading) return;

                            setLoading(true);
                            const { error } = await supabase.auth.resend({
                                type: 'signup',
                                email: email,
                                options: {
                                    emailRedirectTo: 'http://localhost:3000' // or undefined to let Supabase decide
                                }
                            });
                            setLoading(false);

                            if (error) {
                                Alert.alert('Error', error.message);
                            } else {
                                Alert.alert('Sent', 'Confirmation email resent! Please check your inbox (and spam).');
                            }
                        }} className="mt-4">
                            <Text className="text-primary text-center font-inter-medium text-sm">
                                Resend Verification Email
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
