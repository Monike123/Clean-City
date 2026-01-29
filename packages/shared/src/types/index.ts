import { UserRole, ReportStatus, SeverityLevel, WasteCategory } from '../constants/enums';

// --- User Domain ---
export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    mobileNo?: string;
    aadharNo?: string;
    role: UserRole;
    ecoPoints: number;
    createdAt: string; // ISO Date
}

// --- Waste Report Domain ---
export interface LocationData {
    latitude: number;
    longitude: number;
    address?: string; // Reversed geocoded
}

export interface WasteReportResponse {
    id: string;
    userId: string;
    imageUrl: string;
    location: LocationData;
    wasteCategory: WasteCategory;
    aiConfidenceScore?: number;
    description?: string;
    status: ReportStatus;
    severity: SeverityLevel;
    createdAt: string;
    updatedAt: string;
}

export interface WasteReportRequest {
    imageUrl: string;
    location: LocationData;
    description?: string;
    wasteCategory?: WasteCategory; // Can be AI suggest or user overridden
}

// --- IoT/Sensor Domain ---
export interface IoTDevice {
    id: string;
    name: string;
    location: LocationData;
    status: 'online' | 'offline' | 'maintenance';
}

export interface SensorData {
    deviceId: string;
    metricType: 'air_quality' | 'fill_level' | 'temperature';
    value: number;
    unit: string;
    timestamp: string;
}

// --- API Commons ---
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
