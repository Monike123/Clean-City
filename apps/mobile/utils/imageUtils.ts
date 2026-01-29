/**
 * Image Utilities for Clear City
 * Handles image URI conversion from PostgreSQL bytea hex format
 * With caching for performance
 */

import { getCachedImage, cacheImage } from '../services/imageCacheService';
import { supabase } from '../lib/supabase';

/**
 * Decode PostgreSQL bytea hex format to string
 */
function hexToString(hexStr: string): string | null {
    try {
        const hex = hexStr.slice(2);
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
            const charCode = parseInt(hex.substring(i, i + 2), 16);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch (e) {
        return null;
    }
}

/**
 * Get image URI from database storage format (synchronous conversion only)
 */
export function getImageUri(mediaFile: any): string | null {
    if (!mediaFile) return null;
    if (mediaFile === '__large_image__' || mediaFile === '__cached_image__') return null;

    if (typeof mediaFile === 'string') {
        if (mediaFile.startsWith('data:image')) return mediaFile;
        if (mediaFile.startsWith('http')) return mediaFile;

        // PostgreSQL bytea hex format
        if (mediaFile.startsWith('\\x')) {
            const decoded = hexToString(mediaFile);
            if (decoded && decoded.startsWith('data:image')) {
                return decoded;
            }
            return null;
        }

        // Plain base64
        if (mediaFile.length > 100 && /^[A-Za-z0-9+/=]+$/.test(mediaFile.substring(0, 100))) {
            return `data:image/jpeg;base64,${mediaFile}`;
        }
    }

    return null;
}

/**
 * Get image for a report with caching (async)
 * This is the primary function to use for loading images
 */
export async function getReportImageCached(reportId: string): Promise<string | null> {
    // 1. Check cache first (instant)
    const cached = await getCachedImage(reportId);
    if (cached) {
        return cached;
    }

    // 2. Fetch from database
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('media_file')
            .eq('id', reportId)
            .single();

        if (error || !data?.media_file) return null;

        // 3. Convert to URI
        const uri = getImageUri(data.media_file);

        // 4. Cache for next time
        if (uri) {
            await cacheImage(reportId, uri);
        }

        return uri;
    } catch (e) {
        console.log('[getReportImageCached] Error:', e);
        return null;
    }
}

/**
 * Estimate base64 image size in KB
 */
export function estimateImageSize(base64: string): number {
    return Math.round((base64.length * 0.75) / 1024);
}
