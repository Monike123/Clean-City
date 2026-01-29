import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


// Construct valid URL if only Project ID is provided or use full URL
const SUPABASE_URL = "https://espifpuklwcvptddbfkh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Gy9h1pLaijCOUjfj3OM4BA_U7ip1fOi";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
