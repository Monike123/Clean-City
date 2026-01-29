import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'eco_cache_';
const ONE_HOUR = 60 * 60 * 1000;

export const CacheService = {
    get: async (key: string) => {
        try {
            const data = await AsyncStorage.getItem(CACHE_PREFIX + key);
            if (!data) return null;

            const { timestamp, value } = JSON.parse(data);
            if (Date.now() - timestamp > ONE_HOUR) {
                // Expired
                await AsyncStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return value;
        } catch (e) {
            console.error('Cache Get Error:', e);
            return null;
        }
    },

    set: async (key: string, value: any) => {
        try {
            const payload = JSON.stringify({
                timestamp: Date.now(),
                value
            });
            await AsyncStorage.setItem(CACHE_PREFIX + key, payload);
        } catch (e: any) {
            console.error('Cache Set Error:', e);
            // If disk is full, clear everything and try once more
            if (e?.message?.includes('SQLITE_FULL') || e?.code === 13) {
                console.warn('Cache full, clearing storage...');
                try {
                    await AsyncStorage.clear();
                    // Retry set
                    const payload = JSON.stringify({
                        timestamp: Date.now(),
                        value
                    });
                    await AsyncStorage.setItem(CACHE_PREFIX + key, payload);
                } catch (retryError) {
                    console.error('Cache Recovery Failed:', retryError);
                }
            }
        }
    },

    remove: async (key: string) => {
        try {
            await AsyncStorage.removeItem(CACHE_PREFIX + key);
        } catch (e) {
            console.error('Cache Remove Error:', e);
        }
    },

    clearAll: async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (e) {
            console.error('Cache Clear Error:', e);
        }
    }
};
