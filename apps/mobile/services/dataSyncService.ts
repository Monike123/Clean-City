import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const SYNC_INTERVAL = 30000; // 30 seconds
const STORAGE_PREFIX = '@clearcity_';

interface SyncConfig {
    key: string;
    fetchFn: () => Promise<any>;
    ttl?: number;
}

// Remove base64 images from data before saving (too large for storage)
const sanitizeData = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    if (typeof data === 'object') {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(data)) {
            // Skip base64 image data
            if (key === 'media_file' && typeof val === 'string' && val.length > 1000) {
                sanitized[key] = '__large_image__';
                continue;
            }
            // Recursively sanitize nested objects
            if (typeof val === 'object' && val !== null) {
                sanitized[key] = sanitizeData(val);
            } else {
                sanitized[key] = val;
            }
        }
        return sanitized;
    }

    return data;
};

class DataSyncService {
    private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
    private isInitialized = false;
    private currentUserId: string | null = null;
    private currentRole: 'citizen' | 'worker' | null = null;

    // Initialize sync for all required data on app start
    async initialize(userId: string, role: 'citizen' | 'worker') {
        if (this.isInitialized && this.currentUserId === userId) return;

        console.log('[DataSync] Initializing for', role);
        this.currentUserId = userId;
        this.currentRole = role;

        // Define what data to sync based on role
        const configs: SyncConfig[] = role === 'worker'
            ? this.getWorkerSyncConfigs(userId)
            : this.getCitizenSyncConfigs(userId);

        // Initial fetch for all data (parallel)
        await Promise.all(configs.map(config => this.syncData(config)));

        // Start background sync
        configs.forEach(config => this.startBackgroundSync(config));

        this.isInitialized = true;
        console.log('[DataSync] Initialized with', configs.length, 'sync configs');
    }

    private getCitizenSyncConfigs(userId: string): SyncConfig[] {
        return [
            {
                key: 'user_reports',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('reports')
                        .select('id, description, created_at, status, severity, waste_category, location')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(50);
                    return data || [];
                }
            },
            {
                key: 'all_reports',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('reports')
                        .select('id, description, created_at, status, severity, waste_category, location, user_id')
                        .order('created_at', { ascending: false })
                        .limit(30);
                    return data || [];
                }
            },
            {
                key: 'leaderboard',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('profiles')
                        .select('id, full_name, eco_points, avatar_url')
                        .order('eco_points', { ascending: false })
                        .limit(20);
                    return data || [];
                }
            },
            {
                key: 'user_profile',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();
                    return data;
                }
            }
        ];
    }

    private getWorkerSyncConfigs(userId: string): SyncConfig[] {
        return [
            {
                key: 'worker_tasks',
                fetchFn: async () => {
                    const { data: worker } = await supabase
                        .from('workers')
                        .select('id')
                        .eq('user_id', userId)
                        .single();

                    if (!worker) return [];

                    const { data } = await supabase
                        .from('worker_tasks')
                        .select(`
                            id, task_status, priority, sla_deadline,
                            reports:report_id (id, description, location, severity, waste_category, status)
                        `)
                        .eq('worker_id', worker.id)
                        .order('created_at', { ascending: false });
                    return data || [];
                }
            },
            {
                key: 'available_reports',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('reports')
                        .select('id, description, created_at, status, severity, waste_category, location')
                        .is('assigned_worker_id', null)
                        .in('status', ['submitted', 'verified', 'approved', 'pending'])
                        .order('created_at', { ascending: false })
                        .limit(30);
                    return data || [];
                }
            },
            {
                key: 'worker_profile',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('workers')
                        .select('*')
                        .eq('user_id', userId)
                        .single();
                    return data;
                }
            },
            {
                key: 'worker_leaderboard',
                fetchFn: async () => {
                    const { data } = await supabase
                        .from('workers')
                        .select('id, full_name, performance_score, tasks_completed')
                        .order('performance_score', { ascending: false })
                        .limit(20);
                    return data || [];
                }
            }
        ];
    }

    // Sync a single data config
    private async syncData(config: SyncConfig): Promise<void> {
        try {
            const data = await config.fetchFn();
            await this.saveToStorage(config.key, data);
            console.log(`[DataSync] ${config.key} synced: ${Array.isArray(data) ? data.length + ' items' : 'done'}`);
        } catch (error) {
            console.error(`[DataSync] Error syncing ${config.key}:`, error);
        }
    }

    // Start background sync for a config
    private startBackgroundSync(config: SyncConfig): void {
        // Clear existing interval if any
        if (this.syncIntervals.has(config.key)) {
            clearInterval(this.syncIntervals.get(config.key));
        }

        // Set up new interval
        const interval = setInterval(() => {
            this.syncData(config);
        }, SYNC_INTERVAL);

        this.syncIntervals.set(config.key, interval);
    }

    // Save data to AsyncStorage (sanitized)
    private async saveToStorage(key: string, data: any): Promise<void> {
        try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            const sanitized = sanitizeData(data);
            const wrapped = {
                data: sanitized,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(storageKey, JSON.stringify(wrapped));
        } catch (error: any) {
            console.error('[DataSync] Storage error:', error?.message || error);
        }
    }

    // Get data from local storage (FAST - no network)
    async getData<T>(key: string): Promise<T | null> {
        try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            const stored = await AsyncStorage.getItem(storageKey);
            if (!stored) return null;

            const { data } = JSON.parse(stored);
            return data as T;
        } catch (error) {
            return null;
        }
    }

    // Check if data is stale (older than maxAge in ms)
    async isStale(key: string, maxAgeMs: number = 60000): Promise<boolean> {
        try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            const stored = await AsyncStorage.getItem(storageKey);
            if (!stored) return true;

            const { timestamp } = JSON.parse(stored);
            return Date.now() - timestamp > maxAgeMs;
        } catch {
            return true;
        }
    }

    // Force refresh a specific key
    async forceRefresh(key: string, fetchFn: () => Promise<any>): Promise<any> {
        try {
            const data = await fetchFn();
            await this.saveToStorage(key, data);
            return data;
        } catch (error) {
            console.error('[DataSync] Force refresh error:', error);
            return null;
        }
    }

    // Trigger sync for all current configs
    async syncNow(): Promise<void> {
        if (!this.currentUserId || !this.currentRole) return;

        const configs = this.currentRole === 'worker'
            ? this.getWorkerSyncConfigs(this.currentUserId)
            : this.getCitizenSyncConfigs(this.currentUserId);

        await Promise.all(configs.map(config => this.syncData(config)));
    }

    // Stop all syncs
    stopAllSyncs(): void {
        this.syncIntervals.forEach((interval, key) => {
            clearInterval(interval);
        });
        this.syncIntervals.clear();
        this.isInitialized = false;
        console.log('[DataSync] All syncs stopped');
    }

    // Clear all cached data
    async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const appKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
            await AsyncStorage.multiRemove(appKeys);
            console.log('[DataSync] Cleared', appKeys.length, 'cached items');
        } catch (error) {
            console.error('[DataSync] Clear error:', error);
        }
    }
}

export const dataSyncService = new DataSyncService();
