import '../global.css';
import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_700Bold,
    });

    // Restore Supabase session from persisted store
    const { token } = useAuthStore();
    useEffect(() => {
        if (token) {
            // Best effort restore. ideally we need refresh_token for long-lived sessions
            supabase.auth.setSession({
                access_token: token,
                refresh_token: '', // We don't have this yet in store, so session uses access_token only
            }).catch(() => {
                // Ignore error if session invalid unique
            });
        }
    }, [token]);

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
