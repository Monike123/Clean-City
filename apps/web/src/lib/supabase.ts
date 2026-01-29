import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://espifpuklwcvptddbfkh.supabase.co'; // Replace with env in production
const supabaseAnonKey = 'sb_publishable_Gy9h1pLaijCOUjfj3OM4BA_U7ip1fOi'; // Replace with env in production

// NOTE: Ideally use import.meta.env.VITE_SUPABASE_URL but hardcoding for consistent dev environment for now like mobile
// Actually, for web, we can try to use the same logic or read from a shared constants file if possible, 
// but monorepo sharing is distinct. 

// I will just use the hardcoded values verified in mobile's supabase.ts to ensure it works immediately.
// c:\Users\Manas\Desktop\Environment_tech\apps\mobile\lib\supabase.ts

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
