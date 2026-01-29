/**
 * Image Cache Service
 * Caches decoded images locally to avoid repeated hex decoding
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_CACHE_PREFIX = 'img_cache_';
const MAX_CACHED_IMAGES = 20; // Keep only recent 20 images
const CACHE_INDEX_KEY = 'img_cache_index';

// In-memory cache for instant access
const memoryCache: Map<string, string> = new Map();

/**
 * Get image from cache (memory first, then disk)
 */
export async function getCachedImage(reportId: string): Promise<string | null> {
    // Check memory first (instant)
    if (memoryCache.has(reportId)) {
        return memoryCache.get(reportId) || null;
    }

    // Check disk
    try {
        const cached = await AsyncStorage.getItem(IMAGE_CACHE_PREFIX + reportId);
        if (cached) {
            // Also store in memory for next time
            memoryCache.set(reportId, cached);
            return cached;
        }
    } catch (e) {
        console.log('[ImageCache] Read error:', e);
    }

    return null;
}

/**
 * Save image to cache (memory + disk)
 */
export async function cacheImage(reportId: string, dataUri: string): Promise<void> {
    // Save to memory
    memoryCache.set(reportId, dataUri);

    // Save to disk
    try {
        await AsyncStorage.setItem(IMAGE_CACHE_PREFIX + reportId, dataUri);

        // Update cache index for LRU eviction
        await updateCacheIndex(reportId);
    } catch (e) {
        console.log('[ImageCache] Write error:', e);
        // If storage is full, clear old cache
        if (e instanceof Error && e.message.includes('quota')) {
            await clearOldCache();
        }
    }
}

/**
 * Update LRU cache index
 */
async function updateCacheIndex(reportId: string): Promise<void> {
    try {
        const indexStr = await AsyncStorage.getItem(CACHE_INDEX_KEY);
        let index: string[] = indexStr ? JSON.parse(indexStr) : [];

        // Remove if exists, then add to front
        index = index.filter(id => id !== reportId);
        index.unshift(reportId);

        // Evict old items if over limit
        while (index.length > MAX_CACHED_IMAGES) {
            const oldId = index.pop();
            if (oldId) {
                await AsyncStorage.removeItem(IMAGE_CACHE_PREFIX + oldId);
                memoryCache.delete(oldId);
            }
        }

        await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (e) {
        // Ignore index errors
    }
}

/**
 * Clear old cache items
 */
async function clearOldCache(): Promise<void> {
    console.log('[ImageCache] Clearing old cache...');
    try {
        const indexStr = await AsyncStorage.getItem(CACHE_INDEX_KEY);
        if (indexStr) {
            const index: string[] = JSON.parse(indexStr);
            // Remove oldest half
            const toRemove = index.slice(Math.floor(index.length / 2));
            for (const id of toRemove) {
                await AsyncStorage.removeItem(IMAGE_CACHE_PREFIX + id);
                memoryCache.delete(id);
            }
            // Update index
            await AsyncStorage.setItem(
                CACHE_INDEX_KEY,
                JSON.stringify(index.slice(0, Math.floor(index.length / 2)))
            );
        }
    } catch (e) {
        console.log('[ImageCache] Clear error:', e);
    }
}

/**
 * Clear all image cache
 */
export async function clearImageCache(): Promise<void> {
    try {
        const indexStr = await AsyncStorage.getItem(CACHE_INDEX_KEY);
        if (indexStr) {
            const index: string[] = JSON.parse(indexStr);
            for (const id of index) {
                await AsyncStorage.removeItem(IMAGE_CACHE_PREFIX + id);
            }
        }
        await AsyncStorage.removeItem(CACHE_INDEX_KEY);
        memoryCache.clear();
        console.log('[ImageCache] Cache cleared');
    } catch (e) {
        console.log('[ImageCache] Clear all error:', e);
    }
}
