import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Save, User as UserIcon, Lock, Phone, CreditCard, Building2, Clock, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, login } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // FIX: Initialize numeric fields as strings for TextInput compatibility
    // checking if value exists, then converting to String, otherwise empty string
    const [formData, setFormData] = useState({
        fullName: user?.full_name || '',
        mobileNo: user?.mobile_no ? String(user.mobile_no) : '',
        aadharNo: user?.aadhar_no ? String(user.aadhar_no) : '',
    });

    useEffect(() => {
        if (user) {
            // FIX: Ensure updates from store are also converted to strings
            setFormData({
                fullName: user.full_name || '',
                mobileNo: user.mobile_no ? String(user.mobile_no) : '',
                aadharNo: user.aadhar_no ? String(user.aadhar_no) : '',
            });
        }
    }, [user]);

    const handleSignOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        logout();
        router.replace('/(auth)/login');
        setLoading(false);
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: 'clearcity://reset-callback',
        });
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Email Sent', 'Check your email for the password reset link.');
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            // FIX: Convert form strings back to numbers for the database/interface
            // If string is empty, we send null/undefined to avoid casting "" to 0 if preferred, 
            // or just use Number() which casts "" to 0. 
            // Here we use undefined for empty strings to be cleaner.
            const mobileNumber = formData.mobileNo ? Number(formData.mobileNo) : undefined;
            const aadharNumber = formData.aadharNo ? Number(formData.aadharNo) : undefined;

            const updates = {
                full_name: formData.fullName,
                mobile_no: mobileNumber,
                aadhar_no: aadharNumber,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Update local store
            // FIX: Pass the converted numbers to the login function to match UserProfile type
            login({
                ...user,
                full_name: formData.fullName,
                mobile_no: mobileNumber,
                aadhar_no: aadharNumber,
            }, useAuthStore.getState().token || '');

            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error: any) {
            Alert.alert('Update Failed', error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
                    <Text className="text-3xl font-inter-bold text-primary mb-6">Profile</Text>

                    {/* Avatar Section */}
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-2 border-2 border-white shadow-sm">
                            <Text className="text-4xl">{formData.fullName?.[0] || 'U'}</Text>
                        </View>
                        <Text className="text-lg font-inter-bold text-text">{user?.email}</Text>
                        <View className="bg-secondary/10 px-3 py-1 rounded-full mt-2">
                            <Text className="text-secondary text-xs uppercase font-inter-bold">{user?.role || 'Citizen'}</Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View className="space-y-4 mb-8">
                        <View>
                            <Text className="text-textLight font-inter mb-1.5 ml-1">Full Name</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3.5">
                                <UserIcon size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 font-inter text-text"
                                    value={formData.fullName}
                                    onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                                    placeholder="Enter full name"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-textLight font-inter mb-1.5 ml-1">Mobile Number</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3.5">
                                <Phone size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 font-inter text-text"
                                    value={formData.mobileNo}
                                    onChangeText={(t) => setFormData({ ...formData, mobileNo: t })}
                                    placeholder="+91 98765 43210"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-textLight font-inter mb-1.5 ml-1">Aadhar Number</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-3.5">
                                <CreditCard size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 font-inter text-text"
                                    value={formData.aadharNo}
                                    onChangeText={(t) => setFormData({ ...formData, aadharNo: t })}
                                    placeholder="XXXX XXXX XXXX"
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            className="bg-primary flex-row items-center justify-center py-4 rounded-xl shadow-sm active:opacity-90 mt-2"
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <>
                                    <Save size={20} color="white" />
                                    <Text className="text-white font-inter-bold ml-2">Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Actions */}
                    <View className="space-y-3">
                        {/* New: Government Hierarchy */}
                        <TouchableOpacity
                            className="flex-row items-center bg-white border border-gray-200 p-4 rounded-xl"
                            onPress={() => router.push('/hierarchy')}
                        >
                            <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mr-3">
                                <Building2 size={16} color="#2E7D32" />
                            </View>
                            <Text className="text-text font-inter-medium flex-1">Government Hierarchy</Text>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* New: Working Hours */}
                        <TouchableOpacity
                            className="flex-row items-center bg-white border border-gray-200 p-4 rounded-xl"
                            onPress={() => router.push('/working-hours')}
                        >
                            <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                                <Clock size={16} color="#1976D2" />
                            </View>
                            <Text className="text-text font-inter-medium flex-1">Working Hours</Text>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center bg-white border border-gray-200 p-4 rounded-xl"
                            onPress={handleResetPassword}
                        >
                            <View className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center mr-3">
                                <Lock size={16} color="#F57C00" />
                            </View>
                            <Text className="text-text font-inter-medium flex-1">Reset Password</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center bg-white border border-red-100 p-4 rounded-xl"
                            onPress={handleSignOut}
                        >
                            <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center mr-3">
                                <LogOut size={16} color="#DC2626" />
                            </View>
                            <Text className="text-danger font-inter-medium flex-1">Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="h-20" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}