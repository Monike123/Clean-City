export const API_CONFIG = {
    TIMEOUT: 10000,
    BASE_URL: import.meta.env?.VITE_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
};

export const SUPABASE_CONFIG = {
    URL: import.meta.env?.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://espifpuklwcvptddbfkh.supabase.co',
    ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Gy9h1pLaijCOUjfj3OM4BA_U7ip1fOi',
};
