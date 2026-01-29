/**
 * Universal Image Converter for PostgreSQL BYTEA/TEXT Formats
 * Handles conversion from database storage format to displayable images
 */

/**
 * Converts PostgreSQL bytea hex format to base64 data URI
 */
export function byteaHexToDataURI(hexString: string, mediaType: string = 'image/jpeg'): string | null {
    try {
        // Remove \x prefix if present
        const cleanHex = hexString.startsWith('\\x') ? hexString.substring(2) : hexString;

        // Convert hex to bytes
        const bytes = new Uint8Array(
            cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );

        // Convert bytes to base64
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        const base64 = btoa(binary);

        return `data:${mediaType};base64,${base64}`;
    } catch (error) {
        console.error('Error converting bytea hex to data URI:', error);
        return null;
    }
}

/**
 * Universal image source resolver
 * Automatically detects format and converts to displayable image
 */
export function resolveImageSource(mediaFile: string | null | undefined, mediaType: string = 'image/jpeg'): string | null {
    if (!mediaFile) return null;

    // 1. Already a data URI - use as-is
    if (mediaFile.startsWith('data:')) {
        return mediaFile;
    }

    // 2. HTTP/HTTPS URL - use as-is
    if (mediaFile.startsWith('http://') || mediaFile.startsWith('https://')) {
        return mediaFile;
    }

    // 3. PostgreSQL bytea hex format  
    if (mediaFile.startsWith('\\x')) {
        return byteaHexToDataURI(mediaFile, mediaType);
    }

    // 4. Raw hex without \x prefix (unlikely but possible)
    if (/^[0-9a-fA-F]+$/.test(mediaFile) && mediaFile.length > 200) {
        return byteaHexToDataURI(`\\x${mediaFile}`, mediaType);
    }

    // 5. Assume raw base64  
    if (mediaFile.length > 200 && /^[A-Za-z0-9+/=]+$/.test(mediaFile)) {
        return `data:${mediaType};base64,${mediaFile}`;
    }

    // 6. Unknown format
    console.warn('Unknown media_file format:', mediaFile.substring(0, 50));
    return null;
}

/**
 * Simple in-memory cache for images
 */
const imageCache = new Map<string, string>();

/**
 * Get cached image or null
 */
export function getCachedImage(reportId: string): string | null {
    return imageCache.get(reportId) || null;
}

/**
 * Cache an image
 */
export function cacheImage(reportId: string, dataUri: string): void {
    // Limit cache size to 20 images
    if (imageCache.size >= 20) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(reportId, dataUri);
}

/**
 * React component helper for error handling
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>, reportId?: string) {
    console.error(`Image load failed${reportId ? ` for report ${reportId}` : ''}`);
    const img = event.currentTarget;
    img.style.display = 'none';

    const placeholder = img.nextElementSibling;
    if (placeholder) {
        (placeholder as HTMLElement).style.display = 'flex';
    }
}
