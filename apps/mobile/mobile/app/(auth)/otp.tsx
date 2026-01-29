import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft } from 'lucide-react-native';
import { UserRole } from '../../types';


export default function OTPScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const { login } = useAuthStore();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleCodeChange = (text: string, index: number) => {
        if (text.length > 1) {
            const newCode = [...code];
            text.split('').forEach((char, i) => {
                if (index + i < 6) newCode[index + i] = char;
            });
            setCode(newCode);
            // Focus logic would ideally go here
        } else {
            const newCode = [...code];
            newCode[index] = text;
            setCode(newCode);
            // Auto-advance focus logic would go here
        }
    };

    const handleVerify = async () => {
        const otp = code.join('');
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter the full 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });

            if (error) throw error;

            if (data.session) {
                // Fetch profile or create default
                // Simplified for restoration - actual implementation might need profile fetch
                login({
                    id: data.user?.id || '',
                    email: email,
                    eco_points: 0,
                    role: UserRole.CITIZEN,
                    created_at: new Date().toISOString()
                }, data.session.access_token);

                router.replace('/(tabs)/home');
            }
        } catch (e: any) {
            Alert.alert('Verification Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setTimer(30);
        await supabase.auth.resend({
            type: 'signup',
            email: email
        });
        Alert.alert('Code Resent', 'Please check your email.');
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6">
            <TouchableOpacity onPress={() => router.back()} className="mb-6">
                <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>

            <Text className="text-2xl font-bold mb-2">Verification Code</Text>
            <Text className="text-gray-500 mb-8">We sent a code to {email}</Text>

            <View className="flex-row justify-between mb-8">
                {code.map((digit, index) => (
                    <TextInput
                        key={index}
                        className="w-12 h-14 border-2 border-gray-200 rounded-lg text-center text-xl font-bold"
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        onChangeText={(text) => handleCodeChange(text, index)}
                    />
                ))}
            </View>

            <TouchableOpacity
                onPress={handleVerify}
                disabled={loading}
                className="bg-primary py-4 rounded-xl items-center mb-6"
            >
                <Text className="text-white font-bold text-lg">
                    {loading ? 'Verifying...' : 'Verify Email'}
                </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
                <Text className="text-gray-500">Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                    <Text className={`${timer > 0 ? 'text-gray-400' : 'text-primary'} font-bold`}>
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
