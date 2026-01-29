import { supabase } from '../lib/supabase';
import { CacheService } from './cacheService';

// Cache TTL in seconds
const CACHE_TTL = {
    USER_REPORTS: 60,      // 1 minute for user's own reports
    ALL_REPORTS: 30,       // 30 seconds for feed (refresh often)
    SINGLE_REPORT: 120,    // 2 minutes for single report
};

export const ReportService = {
    // No upload needed - store base64 directly
    uploadImage: async (base64Image: string, userId: string): Promise<string | null> => {
        return `data:image/jpeg;base64,${base64Image}`;
    },

    createReport: async (reportData: any) => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .insert([reportData])
                .select()
                .single();

            if (error) {
                console.error('Insert Error:', error);
                throw error;
            }

            // Invalidate caches after new report
            await CacheService.invalidate([
                'all_reports',
                `user_reports_${reportData.user_id}`,
                'map_all_reports'
            ]);

            return data;
        } catch (e) {
            console.error('Create Report Exception:', e);
            throw e;
        }
    },

    // Get user's reports (without media_file for caching)
    getUserReports: async (userId: string) => {
        try {
            const cacheKey = `user_reports_${userId}`;
            const cached = await CacheService.get(cacheKey);

            if (cached) {
                console.log('[ReportService] Using cached user reports');
                return cached;
            }

            console.log('[ReportService] Fetching reports for user:', userId?.substring(0, 8));

            const { data, error } = await supabase
                .from('reports')
                .select('id, description, created_at, status, severity, waste_category, location')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[ReportService] Query error:', error.message);
                throw error;
            }

            console.log('[ReportService] Successfully fetched', data?.length || 0, 'reports');

            // Cache the result (no media_file = small payload)
            await CacheService.set(cacheKey, data || [], CACHE_TTL.USER_REPORTS);

            return data || [];
        } catch (e: any) {
            console.error('[ReportService] Get User Reports Error:', e.message || e);
            return [];
        }
    },

    // Get single report by ID (NO CACHE - fetch fresh with image)
    getReportById: async (id: string) => {
        try {
            console.log('[ReportService] Fetching single report:', id);

            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Don't cache individual reports (they have large images)
            return data;
        } catch (e) {
            console.error('Get Report Error:', e);
            return null;
        }
    },

    // Optimized for feed - NO media_file to keep cache small
    getAllReports: async (limit: number = 20) => {
        try {
            const cacheKey = 'all_reports';
            const cached = await CacheService.get(cacheKey);

            if (cached) {
                console.log('[ReportService] Using cached feed');
                return cached;
            }

            const { data, error } = await supabase
                .from('reports')
                .select('id, description, created_at, status, severity, waste_category, location, user_id')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            await CacheService.set(cacheKey, data || [], CACHE_TTL.ALL_REPORTS);
            console.log(`[ReportService] Fetched ${data?.length || 0} reports`);

            return data || [];
        } catch (e) {
            console.error('Get All Reports Error:', e);
            return [];
        }
    },

    // Get reports for map (with location data)
    getReportsForMap: async () => {
        try {
            const cacheKey = 'map_all_reports';
            const cached = await CacheService.get(cacheKey);

            if (cached) {
                console.log('[MAP] Using cached map reports');
                return cached;
            }

            const { data, error } = await supabase
                .from('reports')
                .select('id, description, location, status, severity, waste_category')
                .not('location', 'is', null)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Filter valid location data
            const validReports = (data || []).filter(r =>
                r.location?.latitude && r.location?.longitude
            );

            await CacheService.set(cacheKey, validReports, 60);
            console.log(`[MAP] Fetched ${validReports.length} reports with location`);

            return validReports;
        } catch (e) {
            console.error('Get Map Reports Error:', e);
            return [];
        }
    },

    // Force refresh (bypass cache)
    refreshAllReports: async (limit: number = 20) => {
        await CacheService.remove('all_reports');
        return ReportService.getAllReports(limit);
    },

    // Get image separately (lazy load)
    getReportImage: async (reportId: string): Promise<string | null> => {
        try {
            console.log('[ReportService] Fetching image for:', reportId);
            const { data, error } = await supabase
                .from('reports')
                .select('media_file')
                .eq('id', reportId)
                .single();

            if (error || !data) {
                console.log('[ReportService] No image data found');
                return null;
            }

            const media = data.media_file;
            if (!media) {
                console.log('[ReportService] media_file is null/empty');
                return null;
            }

            // Log the format for debugging
            const preview = typeof media === 'string' ? media.substring(0, 50) : 'non-string';
            console.log('[ReportService] Image format:', preview + '...');

            return media;
        } catch (e) {
            console.error('[ReportService] getReportImage error:', e);
            return null;
        }
    }
};
