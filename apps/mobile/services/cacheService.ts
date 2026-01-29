import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'eco_cache_';
const ONE_HOUR = 60 * 60 * 1000;
const MAX_CACHE_SIZE_MB = 1.5; // Keep caches small for performance

// Remove large base64 data before caching
const sanitizeForCache = (value: any): any => {
    if (value === null || value === undefined) return value;

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(item => sanitizeForCache(item));
    }

    // Handle objects - remove base64 image data
    if (typeof value === 'object') {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
            // Skip large base64 fields
            if (key === 'media_file' && typeof val === 'string' && val.length > 1000) {
                // Store a placeholder instead
                sanitized[key] = '__cached_image__';
                continue;
            }
            // Recursively sanitize nested objects
            if (typeof val === 'object' && val !== null) {
                sanitized[key] = sanitizeForCache(val);
            } else {
                sanitized[key] = val;
            }
        }
        return sanitized;
    }

    return value;
};

// Estimate size of data in MB
const estimateSize = (data: any): number => {
    try {
        const str = JSON.stringify(data);
        return str.length / (1024 * 1024);
    } catch {
        return 999; // Return large number if can't stringify
    }
};

export const CacheService = {
    get: async (key: string) => {
        try {
            const data = await AsyncStorage.getItem(CACHE_PREFIX + key);
            if (!data) return null;

            const { timestamp, value, ttl = ONE_HOUR } = JSON.parse(data);
            if (Date.now() - timestamp > ttl) {
                // Expired - remove but don't block
                AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => { });
                return null;
            }
            return value;
        } catch (e) {
            console.error('[Cache] Get Error:', e);
            return null;
        }
    },

    set: async (key: string, value: any, ttlSeconds?: number) => {
        try {
            // Sanitize data to remove large base64 images
            const sanitizedValue = sanitizeForCache(value);

            // Check size before caching
            const sizeMB = estimateSize(sanitizedValue);
            if (sizeMB > MAX_CACHE_SIZE_MB) {
                console.warn(`[Cache] Payload too large (${sizeMB.toFixed(2)}MB), skipping: ${key}`);
                return false;
            }

            const payload = JSON.stringify({
                timestamp: Date.now(),
                ttl: (ttlSeconds || 3600) * 1000,
                value: sanitizedValue
            });

            await AsyncStorage.setItem(CACHE_PREFIX + key, payload);
            return true;
        } catch (e: any) {
            console.error('[Cache] Set Error:', e);
            // If disk is full, clear old caches silently
            if (e?.message?.includes('SQLITE_FULL') || e?.code === 13) {
                CacheService.clearAll().catch(() => { });
            }
            return false;
        }
    },

    remove: async (key: string) => {
        try {
            await AsyncStorage.removeItem(CACHE_PREFIX + key);
        } catch (e) {
            // Silent fail for remove
        }
    },

    // Invalidate multiple keys at once
    invalidate: async (keys: string[]) => {
        try {
            const fullKeys = keys.map(k => CACHE_PREFIX + k);
            await AsyncStorage.multiRemove(fullKeys);
        } catch (e) {
            // Silent fail
        }
    },

    clearAll: async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
                console.log(`[Cache] Cleared ${cacheKeys.length} cached items`);
            }
        } catch (e) {
            console.error('[Cache] Clear Error:', e);
        }
    },

    // Get cache stats
    getStats: async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            let totalSize = 0;

            for (const key of cacheKeys) {
                const data = await AsyncStorage.getItem(key);
                if (data) {
                    totalSize += data.length;
                }
            }

            return {
                count: cacheKeys.length,
                sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
        } catch {
            return { count: 0, sizeMB: '0' };
        }
    }
};
